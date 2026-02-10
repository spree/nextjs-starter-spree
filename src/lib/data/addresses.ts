"use server";

import {
  listAddresses as _listAddresses,
  getAddress as _getAddress,
  createAddress as _createAddress,
  updateAddress as _updateAddress,
  deleteAddress as _deleteAddress,
} from "@spree/next";

export interface AddressParams {
  firstname: string;
  lastname: string;
  address1: string;
  address2?: string;
  city: string;
  zipcode: string;
  phone?: string;
  company?: string;
  country_iso: string;
  state_abbr?: string;
  state_name?: string;
}

export async function getAddresses() {
  try {
    return await _listAddresses();
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
      error: error instanceof Error ? error.message : "Failed to create address",
    };
  }
}

export async function updateAddress(id: string, address: Partial<AddressParams>) {
  try {
    const result = await _updateAddress(id, address);
    return { success: true, address: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update address",
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
      error: error instanceof Error ? error.message : "Failed to delete address",
    };
  }
}
