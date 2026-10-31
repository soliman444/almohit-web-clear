export type OdooTradeStatus = "normal" | "pending" | "approved" | "rejected";
export type OdooAppRole = "merchant" | "buyer" | "distributor" | "marketer" | "warehouse_manager";

export type OdooWarehouseAccessPayload = {
  warehouses?: Array<{ id: number; name: string }>;
  default_warehouse_id?: number | null;
  permissions?: string[];
};

export type WarehouseAccess = {
  warehouses: Array<{ id: string; name: string }>;
  defaultWarehouseId: string | null;
  permissions: string[];
};

export type OdooApiErrorBody = {
  code: string;
  message: string;
  [key: string]: unknown;
};

export type OdooApiSuccess<T> = {
  ok: true;
  data: T;
};

export type OdooApiError = {
  ok: false;
  error: OdooApiErrorBody;
};

export type OdooApiResponse<T> = OdooApiSuccess<T> | OdooApiError;

export type OdooPaginatedList<T> = {
  items?: T[];
};

export type OdooPaymentTermPayload = {
  id: number;
  name: string;
};

export type PaymentTerm = {
  id: string;
  name: string;
};

export type OdooPriceGroupPayload = {
  id: number;
  name: string;
};

export type OdooAuthUserPayload = {
  user_id: number;
  partner_id: number;
  name: string;
  email: string | null;
  phone?: string | null;
  trade_status: string;
  role?: string | null;
  payment_term?: OdooPaymentTermPayload | null;
  price_group?: OdooPriceGroupPayload | null;
  is_staff?: boolean;
  warehouse_access?: OdooWarehouseAccessPayload | null;
};

export type CurrentCustomer = {
  userId: number;
  partnerId: number;
  name: string;
  email: string | null;
  phone: string | null;
  tradeStatus: OdooTradeStatus;
  role: OdooAppRole;
  paymentTerm: PaymentTerm | null;
  isStaff: boolean;
  warehouseAccess: WarehouseAccess | null;
};

export type OdooHealth = {
  status: string;
  backend: string;
  version: string;
};

export type OdooCookieSetOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
  expires?: Date;
};

export type OdooCookieAdapter = {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: OdooCookieSetOptions): void;
  delete(name: string): void;
};

export function isOdooTradeStatus(value: string): value is OdooTradeStatus {
  return value === "normal" || value === "pending" || value === "approved" || value === "rejected";
}

export function mapTradeStatus(value: string | null | undefined): OdooTradeStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (isOdooTradeStatus(normalized)) return normalized;
  return "normal";
}

export function isOdooAppRole(value: string): value is OdooAppRole {
  return (
    value === "merchant"
    || value === "buyer"
    || value === "distributor"
    || value === "marketer"
    || value === "warehouse_manager"
  );
}

export function mapAppRole(value: string | null | undefined): OdooAppRole {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (isOdooAppRole(normalized)) return normalized;
  return "merchant";
}

export function mapPaymentTerm(payload: OdooPaymentTermPayload | null | undefined): PaymentTerm | null {
  if (!payload || typeof payload.id !== "number" || !payload.name) return null;
  return {
    id: String(payload.id),
    name: payload.name,
  };
}

export function mapWarehouseAccess(
  payload: OdooWarehouseAccessPayload | null | undefined,
): WarehouseAccess | null {
  if (!payload) return null;
  const warehouses = (payload.warehouses ?? [])
    .filter((row) => typeof row?.id === "number" && row.name)
    .map((row) => ({ id: String(row.id), name: row.name }));
  const defaultId = payload.default_warehouse_id;
  return {
    warehouses,
    defaultWarehouseId: typeof defaultId === "number" ? String(defaultId) : null,
    permissions: Array.isArray(payload.permissions)
      ? payload.permissions.map((code) => String(code))
      : [],
  };
}

export function mapCurrentCustomer(payload: OdooAuthUserPayload): CurrentCustomer {
  return {
    userId: payload.user_id,
    partnerId: payload.partner_id,
    name: payload.name,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    tradeStatus: mapTradeStatus(payload.trade_status),
    role: mapAppRole(payload.role),
    paymentTerm: mapPaymentTerm(payload.payment_term),
    isStaff: Boolean(payload.is_staff),
    warehouseAccess: mapWarehouseAccess(payload.warehouse_access),
  };
}
