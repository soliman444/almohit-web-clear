import { cache } from "react";
import type { AuthMeResponse, BusinessStatusResponse, CustomerProfile } from "@/types/contracts";

const noAccess: BusinessStatusResponse = {
  state: null,
  canViewWholesalePrices: false,
};

export const getCurrentCustomerSession = cache(async (): Promise<AuthMeResponse> => {
  const odoo = await import("../odoo/auth");
  if (await odoo.getOdooStaffUser()) {
    return { authenticated: false, user: null };
  }
  if (await odoo.hasOdooSession()) {
    return odoo.getAuthMe();
  }
  return { authenticated: false, user: null };
});

export const getCurrentCustomer = cache(async (): Promise<CustomerProfile | null> => {
  const odoo = await import("../odoo/auth");
  if (await odoo.getOdooStaffUser()) return null;
  if (!(await odoo.hasOdooSession())) return null;
  const customer = await odoo.getCurrentCustomer();
  return customer ? odoo.toCustomerProfile(customer) : null;
});

export const getBusinessStatus = cache(async (): Promise<BusinessStatusResponse> => {
  try {
    const odoo = await import("../odoo/auth");
    if (await odoo.getOdooStaffUser()) {
      return noAccess;
    }
    if (!(await odoo.hasOdooSession())) return noAccess;
    // Reuse the same cached /auth/me as getCurrentCustomer — do not call Odoo twice.
    const customer = await odoo.getCurrentCustomer();
    if (!customer) return noAccess;
    const canViewWholesalePrices = customer.tradeStatus === "approved";
    return {
      state: customer.tradeStatus,
      canViewWholesalePrices,
    };
  } catch {
    // Shell/header must stay up when Odoo is briefly unreachable.
    return noAccess;
  }
});
