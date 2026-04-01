import type { MetadataRoute } from "next";
import { getStoreUrl } from "@/lib/seo";
import { generateSitemaps } from "./sitemap";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const storeUrl = getStoreUrl();
  const baseUrl = (storeUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(
    /\/$/,
    "",
  );
  const sitemaps = await generateSitemaps();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/account",
          "/*/account/*",
          "/*/cart",
          "/*/checkout",
          "/*/checkout/*",
          "/*?*sort=*",
          "/*?*page=*",
          "/*?*filter*=*",
        ],
      },
    ],
    sitemap: sitemaps.map((s) => `${baseUrl}/sitemap/${s.id}.xml`),
    host: baseUrl,
  };
}
