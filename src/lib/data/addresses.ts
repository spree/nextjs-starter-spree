"use server";

import {
  createAddress as _createAddress,
  deleteAddress as _deleteAddress,
  getAddress as _getAddress,
  updateAddress as _updateAddress,
  listAddresses,
} from "@spree/next";
import type { AddressParams } from "@spree/sdk";
import { actionResult, withFallback } from "./utils";

export async function getAddresses() {
  return withFallback(() => listAddresses(), { data: [] });
}

export async function getAddress(id: string) {
  return withFallback(() => _getAddress(id), null);
}

export async function createAddress(address: AddressParams) {
  return actionResult(async () => {
    const result = await _createAddress(address);
    return { address: result };
  }, "Failed to create address");
}

export async function updateAddress(
  id: string,
  address: Partial<AddressParams>,
) {
  return actionResult(async () => {
    const result = await _updateAddress(id, address);
    return { address: result };
  }, "Failed to update address");
}

export async function deleteAddress(id: string) {
  return actionResult(async () => {
    await _deleteAddress(id);
    return {};
  }, "Failed to delete address");
}
