"use server";

import {
  createAddress as _createAddress,
  deleteAddress as _deleteAddress,
  getAddress as _getAddress,
  updateAddress as _updateAddress,
  listAddresses,
} from "@spree/next";
import type { AddressParams } from "@spree/sdk";

export type { AddressParams };

export async function getAddresses() {
  try {
    return await listAddresses();
  } catch {
    return { data: [] };
  }
}

export async function getAddress(id: string) {
  try {
    return await _getAddress(id);
  } catch {
    return null;
  }
}

export async function createAddress(address: AddressParams) {
  try {
    const result = await _createAddress(address);
    return { success: true, address: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create address",
    };
  }
}

export async function updateAddress(
  id: string,
  address: Partial<AddressParams>,
) {
  try {
    const result = await _updateAddress(id, address);
    return { success: true, address: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update address",
    };
  }
}

export async function deleteAddress(id: string) {
  try {
    await _deleteAddress(id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete address",
    };
  }
}
