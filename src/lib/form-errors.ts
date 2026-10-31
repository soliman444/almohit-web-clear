import { redirect } from "next/navigation";
import { ApiClientError, ApiUnavailableError } from "./odoo/errors";

export type FormErrorState = {
  code: string;
  message: string;
  fields: string[];
};

export type FormErrorQuery = {
  error?: string;
  detail?: string;
  fields?: string;
};

const BUYER_MESSAGES: Record<string, string> = {
  supplier: "Choose a supplier.",
  currency: "Choose a valid currency.",
  lines: "Add at least one valid purchase line (product, quantity, and unit price).",
  image: "One or more images were rejected. Use JPEG, PNG, or WebP under the size limit.",
  name: "Name is required.",
  invalid: "Check the highlighted fields and try again.",
  editable: "This purchase can no longer be edited or confirmed.",
  qty: "Enter valid received quantities.",
  notfound: "The requested record was not found.",
  unavailable: "Service temporarily unavailable. Please try again shortly.",
  failed: "Could not save. Check the highlighted fields and try again.",
};

const TRADE_MESSAGES: Record<string, string> = {
  kyc: "Check the highlighted fields. Required details are missing or invalid.",
  image: "Upload a JPEG, PNG, GIF, or WebP shop photo under 5 MB.",
  payment: "Choose how the shop will pay.",
  role: "Choose a valid account type.",
  unavailable: "Service temporarily unavailable. Please try again shortly.",
  failed: "Could not submit the approval request. Check the highlighted fields.",
};

function cleanDetail(value?: string) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.slice(0, 280);
}

function uniqueFields(fields: Array<string | undefined | null>) {
  return [...new Set(fields.filter((field): field is string => Boolean(field)))];
}

export function parseFormErrorQuery(
  query: FormErrorQuery,
  catalog: Record<string, string> = BUYER_MESSAGES,
): FormErrorState | null {
  const code = query.error?.trim();
  if (!code) return null;
  const detail = cleanDetail(query.detail);
  const fields = uniqueFields((query.fields ?? "").split(",").map((field) => field.trim()));
  return {
    code,
    message: detail || catalog[code] || catalog.failed || "Something went wrong.",
    fields,
  };
}

export function parseBuyerFormError(query: FormErrorQuery) {
  return parseFormErrorQuery(query, BUYER_MESSAGES);
}

export function parseTradeFormError(query: FormErrorQuery) {
  return parseFormErrorQuery(query, TRADE_MESSAGES);
}

const WAREHOUSE_MESSAGES: Record<string, string> = {
  qty: "Enter valid quantities for each line.",
  lines: "Add at least one valid line.",
  warehouse: "Choose a warehouse.",
  file: "Upload a CSV or XLSX inventory file.",
  invalid: "Check the highlighted fields and try again.",
  notfound: "The requested record was not found.",
  unavailable: "Service temporarily unavailable. Please try again shortly.",
  failed: "Could not complete this warehouse action. Try again.",
  duplicate: "This inventory file was already imported.",
  permission: "You do not have permission for this warehouse action.",
};

export function parseWarehouseFormError(query: FormErrorQuery) {
  return parseFormErrorQuery(query, WAREHOUSE_MESSAGES);
}

export function formErrorHref(
  path: string,
  error: { code: string; message?: string; fields?: string[] },
) {
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set("error", error.code);
  const detail = cleanDetail(error.message);
  if (detail) url.searchParams.set("detail", detail);
  const fields = uniqueFields(error.fields ?? []);
  if (fields.length > 0) url.searchParams.set("fields", fields.join(","));
  return `${url.pathname}${url.search}`;
}

export function redirectFormError(
  path: string,
  error: { code: string; message?: string; fields?: string[] },
): never {
  redirect(formErrorHref(path, error));
}

export function fieldHasError(fields: string[] | undefined, ...names: string[]) {
  if (!fields?.length) return false;
  return names.some((name) => fields.includes(name));
}

export function fieldClassName(
  base: string,
  fields: string[] | undefined,
  ...names: string[]
) {
  return fieldHasError(fields, ...names) ? `${base} is-invalid` : base;
}

function inferFieldsFromMessage(code: string, message: string): string[] {
  const text = `${code} ${message}`.toLowerCase();
  const fields: string[] = [];
  if (/(currency)/.test(text)) fields.push("currencyId");
  if (/(supplier|partner)/.test(text)) fields.push("supplierId");
  if (/(product|quantity|price|line|uom|planned)/.test(text)) fields.push("lines");
  if (/(image|photo|mimetype|attachment)/.test(text)) fields.push("images");
  if (/(date_order|order date)/.test(text)) fields.push("dateOrder");
  if (/(notes|note)/.test(text)) fields.push("notes");
  if (/(name)/.test(text) && !/(company|shop|manager|employee)/.test(text)) fields.push("name");
  if (/(businessname|company.?name|shop.?name)/.test(text)) fields.push("businessName");
  if (/(tax|commercial registration)/.test(text)) fields.push("taxNumber");
  if (/(business.?type|coverage|what you source)/.test(text)) fields.push("businessType");
  if (/(city)/.test(text)) fields.push("city");
  if (/(address|street)/.test(text)) fields.push("address");
  if (/(manager|contact person)/.test(text)) fields.push("managerName");
  if (/(employee)/.test(text)) fields.push("employeeName");
  if (/(bank)/.test(text)) fields.push("bankAccount");
  if (/(payment)/.test(text)) fields.push("paymentMethod");
  if (/(phone)/.test(text)) fields.push("phone");
  return uniqueFields(fields);
}

export function mapApiClientFormError(
  error: unknown,
  options: {
    fallbackPath: string;
    fallbackCode?: string;
    known?: Record<string, { code: string; fields?: string[]; path?: string }>;
  },
): never {
  if (error instanceof ApiUnavailableError) {
    redirectFormError(options.fallbackPath, { code: "unavailable", fields: [] });
  }
  if (error instanceof ApiClientError) {
    if (error.status === 401 || error.code === "UNAUTHENTICATED") redirect("/login");
    if (error.code === "ACCESS_DENIED" || error.code === "WHOLESALE_APPROVAL_REQUIRED") {
      redirect("/account");
    }
    const known = options.known?.[error.code];
    const inferred = inferFieldsFromMessage(error.code, error.message);
    if (known) {
      redirectFormError(known.path ?? options.fallbackPath, {
        code: known.code,
        message: error.message,
        fields: uniqueFields([...(known.fields ?? []), ...inferred]),
      });
    }
    redirectFormError(options.fallbackPath, {
      code: options.fallbackCode ?? "failed",
      message: error.message,
      fields: inferred,
    });
  }
  throw error;
}
