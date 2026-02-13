"use server";

import {
  getCustomer as _getCustomer,
  login as _login,
  logout as _logout,
  register as _register,
  updateCustomer as _updateCustomer,
} from "@spree/next";
import { actionResult } from "./utils";

export async function getCustomer() {
  return _getCustomer();
}

export async function login(email: string, password: string) {
  return _login(email, password);
}

export async function register(
  email: string,
  password: string,
  passwordConfirmation: string,
) {
  return _register(email, password, passwordConfirmation);
}

export async function logout() {
  return _logout();
}

export async function updateCustomer(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
}) {
  return actionResult(async () => {
    const customer = await _updateCustomer(data);
    return { customer };
  }, "Update failed");
}
