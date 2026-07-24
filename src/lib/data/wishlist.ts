"use server";

import type { Wishlist } from "@spree/sdk";
import { updateTag } from "next/cache";
import { getClient, isAuthError, withAuthRefresh } from "@/lib/spree";
import { actionResult } from "./utils";

type WishlistItemWithVariantProductId = NonNullable<
  Wishlist["items"]
>[number] & {
  variant?: {
    product_id?: string;
  };
  product_name?: string;
  product_slug?: string;
  thumbnail_url?: string | null;
};

async function enrichWishlistItems(
  wishlist: Wishlist,
  token: string,
): Promise<Wishlist> {
  if (!wishlist.items?.length) return wishlist;

  const productIds = Array.from(
    new Set(
      wishlist.items
        .map(
          (item) =>
            (item as WishlistItemWithVariantProductId).variant?.product_id,
        )
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (productIds.length === 0) return wishlist;

  const products = await Promise.all(
    productIds.map(async (id) => {
      const product = await getClient().products.get(
        id,
        { expand: ["images"] },
        { token },
      );
      return [id, product] as const;
    }),
  );

  const productMap = new Map(products);

  const items = wishlist.items.map((item) => {
    const nextItem = { ...item } as WishlistItemWithVariantProductId;
    const productId = nextItem.variant?.product_id;
    if (!productId) return nextItem;

    const product = productMap.get(productId);
    if (!product) return nextItem;

    nextItem.product_name = nextItem.product_name || product.name;
    nextItem.product_slug = nextItem.product_slug || product.slug;
    nextItem.thumbnail_url =
      nextItem.thumbnail_url ||
      product.thumbnail_url ||
      product.images?.[0]?.styles?.product ||
      product.images?.[0]?.styles?.large ||
      product.images?.[0]?.styles?.small ||
      product.images?.[0]?.url ||
      null;

    return nextItem;
  });

  return { ...wishlist, items };
}

async function fetchWishlistById(id: string, token: string): Promise<Wishlist> {
  const wishlist = await getClient().wishlists.get(
    id,
    {
      expand: [
        "items.variant",
        "items.variant.product",
        "items.variant.images",
      ],
    },
    { token },
  );

  return enrichWishlistItems(wishlist, token);
}

async function getOrCreateDefaultWishlist(token: string): Promise<Wishlist> {
  const response = await getClient().wishlists.list({ limit: 50 }, { token });
  const existing =
    response.data.find((wishlist) => wishlist.is_default) ?? response.data[0];

  if (existing) {
    return fetchWishlistById(existing.id, token);
  }

  const created = await getClient().wishlists.create(
    {
      name: "My Wishlist",
      is_default: true,
    },
    { token },
  );

  return fetchWishlistById(created.id, token);
}

export async function getWishlist(): Promise<Wishlist | null> {
  try {
    return await withAuthRefresh(async (options) => {
      if (!options.token) return null;
      return getOrCreateDefaultWishlist(options.token);
    });
  } catch (error) {
    if (!isAuthError(error)) {
      throw error;
    }
    return null;
  }
}

export async function addWishlistItem(variantId: string, quantity = 1) {
  return actionResult(async () => {
    const wishlist = await withAuthRefresh(async (options) => {
      if (!options.token) {
        throw new Error("Not authenticated");
      }

      const current = await getOrCreateDefaultWishlist(options.token);
      const existingItem = current.items?.find(
        (item) => item.variant_id === variantId,
      );

      if (!existingItem) {
        await getClient().wishlists.items.create(
          current.id,
          { variant_id: variantId, quantity },
          options,
        );
      }

      return fetchWishlistById(current.id, options.token);
    });

    updateTag("wishlist");
    return { wishlist };
  }, "Failed to add item to wishlist");
}

export async function removeWishlistItemByVariant(variantId: string) {
  return actionResult(async () => {
    const wishlist = await withAuthRefresh(async (options) => {
      if (!options.token) {
        throw new Error("Not authenticated");
      }

      const current = await getOrCreateDefaultWishlist(options.token);
      const existingItem = current.items?.find(
        (item) => item.variant_id === variantId,
      );

      if (!existingItem) {
        return current;
      }

      await getClient().wishlists.items.delete(
        current.id,
        existingItem.id,
        options,
      );

      return fetchWishlistById(current.id, options.token);
    });

    updateTag("wishlist");
    return { wishlist };
  }, "Failed to remove item from wishlist");
}
