import { z } from "zod";
import { DEFAULT_COUNTRY_CODE, normalizeCountryCode } from "./geo/countries";

export const APP_ROLES = ["merchant", "buyer", "distributor", "marketer", "warehouse_manager"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type ParsedTradeKyc = {
  businessName: string;
  businessType?: string;
  taxNumber: string;
  city: string;
  address: string;
  managerName: string;
  employeeName?: string;
  bankAccount?: string;
  paymentMethod?: "bank_transfer" | "cash" | "both";
  phone?: string;
  notes?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
};

export function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseOptionalCoord(raw: string): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function parseGeoFields(formData: FormData): {
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  fields: string[];
} {
  const fields: string[] = [];
  const countryRaw = formValue(formData, "countryCode");
  const countryCode = countryRaw
    ? normalizeCountryCode(countryRaw, "")
    : undefined;
  if (countryRaw && !countryCode) fields.push("countryCode");

  const latitude = parseOptionalCoord(formValue(formData, "latitude"));
  const longitude = parseOptionalCoord(formValue(formData, "longitude"));
  if (formValue(formData, "latitude") && latitude === undefined) fields.push("latitude");
  if (formValue(formData, "longitude") && longitude === undefined) fields.push("longitude");
  if ((latitude === undefined) !== (longitude === undefined)) {
    fields.push("latitude", "longitude");
  }
  if (latitude !== undefined && (latitude < -90 || latitude > 90)) fields.push("latitude");
  if (longitude !== undefined && (longitude < -180 || longitude > 180)) fields.push("longitude");

  return {
    countryCode: countryCode || undefined,
    latitude,
    longitude,
    fields: [...new Set(fields)],
  };
}

const merchantSchema = z.object({
  businessName: z.string().min(2).max(160),
  businessType: z.string().max(120).optional(),
  taxNumber: z.string().min(3).max(80),
  city: z.string().min(2).max(120),
  address: z.string().min(4).max(300),
  managerName: z.string().min(2).max(120),
  employeeName: z.string().max(120).optional(),
  bankAccount: z.string().min(4).max(80),
  paymentMethod: z.enum(["bank_transfer", "cash", "both"]),
  phone: z.string().max(30).optional(),
  notes: z.string().max(1000).optional(),
});

const officeSchema = z.object({
  businessName: z.string().min(2).max(160),
  businessType: z.string().min(2).max(120),
  taxNumber: z.string().min(3).max(80),
  city: z.string().min(2).max(120),
  address: z.string().min(4).max(300),
  managerName: z.string().min(2).max(120),
  phone: z.string().max(30).optional(),
  notes: z.string().max(1000).optional(),
});

const warehouseSchema = z.object({
  phone: z.string().min(5).max(30),
  businessName: z.string().max(160).optional(),
  city: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export function parseAppRole(value: string): AppRole {
  return APP_ROLES.includes(value as AppRole) ? (value as AppRole) : "merchant";
}

function zodFieldNames(error: z.ZodError) {
  return [...new Set(error.issues.map((issue) => String(issue.path[0] ?? "")))].filter(Boolean);
}

export function parseTradeKyc(
  formData: FormData,
  role: AppRole,
): { success: true; data: ParsedTradeKyc } | { success: false; fields: string[] } {
  if (role === "merchant") {
    const parsed = merchantSchema.safeParse({
      businessName: formValue(formData, "businessName"),
      businessType: formValue(formData, "businessType") || undefined,
      taxNumber: formValue(formData, "taxNumber"),
      city: formValue(formData, "city"),
      address: formValue(formData, "address"),
      managerName: formValue(formData, "managerName"),
      employeeName: formValue(formData, "employeeName") || undefined,
      bankAccount: formValue(formData, "bankAccount"),
      paymentMethod: formValue(formData, "paymentMethod"),
      phone: formValue(formData, "phone") || undefined,
      notes: formValue(formData, "notes") || undefined,
    });
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, fields: zodFieldNames(parsed.error) };
  }

  // Marketer KYC includes required country + optional map pin.

  if (role === "warehouse_manager") {
    const parsed = warehouseSchema.safeParse({
      phone: formValue(formData, "phone"),
      businessName: formValue(formData, "businessName") || undefined,
      city: formValue(formData, "city") || undefined,
      notes: formValue(formData, "notes") || undefined,
    });
    if (!parsed.success) {
      return { success: false, fields: zodFieldNames(parsed.error) };
    }
    return {
      success: true,
      data: {
        businessName: parsed.data.businessName || "",
        taxNumber: "",
        city: parsed.data.city || "",
        address: "",
        managerName: "",
        phone: parsed.data.phone,
        notes: parsed.data.notes,
      },
    };
  }

  const parsed = officeSchema.safeParse({
    businessName: formValue(formData, "businessName"),
    businessType: formValue(formData, "businessType"),
    taxNumber: formValue(formData, "taxNumber"),
    city: formValue(formData, "city"),
    address: formValue(formData, "address"),
    managerName: formValue(formData, "managerName"),
    phone: formValue(formData, "phone") || undefined,
    notes: formValue(formData, "notes") || undefined,
  });
  if (!parsed.success) {
    return { success: false, fields: zodFieldNames(parsed.error) };
  }

  if (role === "marketer") {
    const geo = parseGeoFields(formData);
    const countryCode = geo.countryCode || normalizeCountryCode(formValue(formData, "countryCode"), "");
    if (!countryCode) {
      return { success: false, fields: [...geo.fields, "countryCode"] };
    }
    if (geo.fields.length) {
      return { success: false, fields: geo.fields };
    }
    return {
      success: true,
      data: {
        ...parsed.data,
        countryCode: countryCode || DEFAULT_COUNTRY_CODE,
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    };
  }

  return { success: true, data: parsed.data };
}

export function tradeApplicationFromKyc(role: AppRole, input: ParsedTradeKyc) {
  return {
    companyName: input.businessName,
    role,
    taxNumber: input.taxNumber,
    businessType: input.businessType,
    phone: input.phone,
    street: input.address,
    city: input.city,
    managerName: input.managerName,
    employeeName: input.employeeName,
    bankAccount: input.bankAccount,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    countryCode: input.countryCode,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}
