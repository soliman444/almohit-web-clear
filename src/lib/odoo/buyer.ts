import { rewriteOdooImageUrl } from "./images";
import { odooRequest } from "./client";
import type { OdooCookieAdapter, OdooPaginatedList } from "./types";

export type BuyerNamedRel = {
  id: string;
  name: string;
};

export type BuyerCategoryRel = BuyerNamedRel & {
  completeName: string | null;
};

/** Matches Odoo `_is_raw_material_product` (buyer.py). */
export const BUYER_RAW_CATEGORY_COMPLETE_NAME = "المواد الخام - سلال";

export type BuyerSupplier = {
  id: string;
  name: string;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  street: string | null;
  street2: string | null;
  city: string | null;
  zip: string | null;
  state: BuyerNamedRel | null;
  country: { id: string; name: string; code: string | null } | null;
  vat: string | null;
  comment: string | null;
  supplierRank: number;
  active: boolean;
};

export type BuyerProduct = {
  id: string;
  templateId: string;
  name: string;
  defaultCode: string | null;
  barcode: string | null;
  category: BuyerCategoryRel | null;
  brand: BuyerNamedRel | null;
  uom: BuyerNamedRel | null;
  purchaseUom: BuyerNamedRel | null;
  imageUrl: string | null;
  active: boolean;
  type: string;
  standardCost: number;
  lastPurchasePrice: number | null;
  purchaseOk: boolean;
};

export type BuyerUom = {
  id: string;
  name: string;
  category: BuyerNamedRel | null;
  uomType: string | null;
  rounding: number | null;
};

export type BuyerPurchaseLine = {
  id: string;
  product: { id: string; name: string; defaultCode: string | null };
  quantity: number;
  uom: BuyerNamedRel | null;
  priceUnit: number;
  subtotal: number;
  plannedDate: string | null;
  receivedQty: number;
  remainingQty: number;
};

export type BuyerPurchaseImage = {
  id: string;
  name: string;
  contentType: string | null;
  url: string;
};

export type BuyerReceiptSummary = {
  id: string;
  name: string;
  state: string;
  scheduledDate: string | null;
  dateDone: string | null;
  supplier: BuyerNamedRel | null;
  purchase: BuyerNamedRel | null;
};

export type BuyerPurchase = {
  id: string;
  name: string;
  supplier: BuyerNamedRel | null;
  state: string;
  dateOrder: string | null;
  currency: BuyerNamedRel | null;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  buyer: BuyerNamedRel | null;
  receiptCount: number;
  receiptStates: string[];
  imageCount: number;
  notes: string | null;
  lines: BuyerPurchaseLine[];
  receipts: BuyerReceiptSummary[];
  images: BuyerPurchaseImage[];
};

export type BuyerReceiptLine = {
  moveId: string;
  product: { id: string; name: string; defaultCode: string | null };
  orderedQty: number;
  receivedQty: number;
  remainingQty: number;
  uom: BuyerNamedRel | null;
  sourceLocation: BuyerNamedRel | null;
  destinationLocation: BuyerNamedRel | null;
};

export type BuyerReceipt = BuyerReceiptSummary & {
  lines: BuyerReceiptLine[];
  backorderId: string | null;
  backorders: BuyerNamedRel[];
};

export type BuyerListResult<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

export type BuyerSupplierInput = {
  name: string;
  phone?: string;
  mobile?: string;
  email?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  taxNumber?: string;
  notes?: string;
};

export type BuyerProductInput = {
  name: string;
  defaultCode?: string;
  barcode?: string;
  type?: "consu" | "service" | "product";
  purchaseDescription?: string;
  uomId?: number;
  uomPoId?: number;
  imageBase64?: string;
  imageContentType?: string;
};

export type BuyerPurchaseLineInput = {
  id?: number;
  productId: number;
  quantity: number;
  priceUnit: number;
  plannedDate?: string;
  remove?: boolean;
};

export type BuyerPurchaseInput = {
  supplierId: number;
  currencyId?: number;
  dateOrder?: string;
  notes?: string;
  lines?: BuyerPurchaseLineInput[];
  images?: Array<{ name?: string; imageBase64: string; imageContentType: string }>;
};

type OdooNamed = { id: number; name: string } | null | undefined;

type OdooBuyerSupplier = {
  id: number;
  name: string;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  zip?: string | null;
  state?: OdooNamed;
  country?: { id: number; name: string; code?: string | null } | null;
  vat?: string | null;
  comment?: string | null;
  supplier_rank?: number;
  active?: boolean;
};

type OdooBuyerCategory = {
  id: number;
  name: string;
  complete_name?: string | null;
  parent_id?: number | null;
};

type OdooBuyerProduct = {
  id: number;
  template_id: number;
  name: string;
  default_code?: string | null;
  barcode?: string | null;
  category?: OdooBuyerCategory | null;
  brand?: OdooNamed;
  uom?: OdooNamed;
  purchase_uom?: OdooNamed;
  image_url?: string | null;
  active?: boolean;
  type?: string;
  standard_cost?: number;
  last_purchase_price?: number | null;
  purchase_ok?: boolean;
};

type OdooBuyerUom = {
  id: number;
  name: string;
  category?: OdooNamed;
  uom_type?: string | null;
  rounding?: number | null;
};

type OdooBuyerPurchaseLine = {
  id: number;
  product: { id: number; name: string; default_code?: string | null };
  quantity: number;
  uom?: OdooNamed;
  price_unit: number;
  subtotal: number;
  planned_date?: string | null;
  received_qty?: number;
  remaining_qty?: number;
};

type OdooBuyerReceipt = {
  id: number;
  name: string;
  state: string;
  scheduled_date?: string | null;
  date_done?: string | null;
  supplier?: OdooNamed;
  purchase?: OdooNamed;
  lines?: Array<{
    move_id: number;
    product: { id: number; name: string; default_code?: string | null };
    ordered_qty: number;
    received_qty: number;
    remaining_qty: number;
    uom?: OdooNamed;
    source_location?: OdooNamed;
    destination_location?: OdooNamed;
  }>;
  backorder_id?: number | null;
  backorders?: Array<{ id: number; name: string }>;
};

type OdooBuyerPurchase = {
  id: number;
  name: string;
  supplier?: OdooNamed;
  state: string;
  date_order?: string | null;
  currency?: OdooNamed;
  amount_untaxed?: number;
  amount_tax?: number;
  amount_total?: number;
  buyer?: OdooNamed;
  receipt_count?: number;
  receipt_states?: string[];
  image_count?: number;
  notes?: string | null;
  lines?: OdooBuyerPurchaseLine[];
  receipts?: OdooBuyerReceipt[];
  images?: Array<{ id: number; name: string; content_type?: string | null; url: string }>;
};

type OdooBuyerPage<T> = OdooPaginatedList<T> & {
  pagination?: {
    page?: number;
    page_size?: number;
    total?: number;
    pages?: number;
    has_next?: boolean;
    has_previous?: boolean;
  };
};

function named(rel: OdooNamed): BuyerNamedRel | null {
  if (!rel || typeof rel.id !== "number") return null;
  return { id: String(rel.id), name: rel.name };
}

function mapCategory(rel: OdooBuyerCategory | null | undefined): BuyerCategoryRel | null {
  if (!rel || typeof rel.id !== "number") return null;
  return {
    id: String(rel.id),
    name: rel.name,
    completeName: rel.complete_name ?? null,
  };
}

export function isBuyerRawMaterialProduct(product: BuyerProduct) {
  const complete = product.category?.completeName?.trim();
  if (complete === BUYER_RAW_CATEGORY_COMPLETE_NAME) return true;
  return product.category?.name?.trim() === BUYER_RAW_CATEGORY_COMPLETE_NAME;
}

export function buyerPurchaseUomLabel(product: BuyerProduct) {
  return product.purchaseUom?.name || product.uom?.name || null;
}

function mapPagination<T>(payload: OdooBuyerPage<T> | null | undefined, itemCount: number) {
  const page = payload?.pagination?.page ?? 1;
  const pageSize = payload?.pagination?.page_size ?? Math.max(itemCount, 1);
  const total = payload?.pagination?.total ?? itemCount;
  const pages = payload?.pagination?.pages ?? (total === 0 ? 0 : Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    pages,
    hasNext: payload?.pagination?.has_next ?? page < pages,
    hasPrevious: payload?.pagination?.has_previous ?? page > 1,
  };
}

function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export function mapBuyerSupplier(payload: OdooBuyerSupplier): BuyerSupplier {
  return {
    id: String(payload.id),
    name: payload.name,
    phone: payload.phone ?? null,
    mobile: payload.mobile ?? null,
    email: payload.email ?? null,
    street: payload.street ?? null,
    street2: payload.street2 ?? null,
    city: payload.city ?? null,
    zip: payload.zip ?? null,
    state: named(payload.state),
    country: payload.country
      ? { id: String(payload.country.id), name: payload.country.name, code: payload.country.code ?? null }
      : null,
    vat: payload.vat ?? null,
    comment: payload.comment ?? null,
    supplierRank: payload.supplier_rank ?? 0,
    active: Boolean(payload.active),
  };
}

export function mapBuyerProduct(payload: OdooBuyerProduct): BuyerProduct {
  return {
    id: String(payload.id),
    templateId: String(payload.template_id),
    name: payload.name,
    defaultCode: payload.default_code ?? null,
    barcode: payload.barcode ?? null,
    category: mapCategory(payload.category),
    brand: named(payload.brand),
    uom: named(payload.uom),
    purchaseUom: named(payload.purchase_uom),
    imageUrl: rewriteOdooImageUrl(payload.image_url),
    active: Boolean(payload.active),
    type: payload.type ?? "product",
    standardCost: Number(payload.standard_cost ?? 0),
    lastPurchasePrice: payload.last_purchase_price == null ? null : Number(payload.last_purchase_price),
    purchaseOk: Boolean(payload.purchase_ok),
  };
}

export function mapBuyerUom(payload: OdooBuyerUom): BuyerUom {
  return {
    id: String(payload.id),
    name: payload.name,
    category: named(payload.category),
    uomType: payload.uom_type ?? null,
    rounding: payload.rounding == null ? null : Number(payload.rounding),
  };
}

function mapPurchaseLine(payload: OdooBuyerPurchaseLine): BuyerPurchaseLine {
  return {
    id: String(payload.id),
    product: {
      id: String(payload.product.id),
      name: payload.product.name,
      defaultCode: payload.product.default_code ?? null,
    },
    quantity: Number(payload.quantity ?? 0),
    uom: named(payload.uom),
    priceUnit: Number(payload.price_unit ?? 0),
    subtotal: Number(payload.subtotal ?? 0),
    plannedDate: payload.planned_date ?? null,
    receivedQty: Number(payload.received_qty ?? 0),
    remainingQty: Number(payload.remaining_qty ?? 0),
  };
}

function mapReceiptSummary(payload: OdooBuyerReceipt): BuyerReceiptSummary {
  return {
    id: String(payload.id),
    name: payload.name,
    state: payload.state,
    scheduledDate: payload.scheduled_date ?? null,
    dateDone: payload.date_done ?? null,
    supplier: named(payload.supplier),
    purchase: named(payload.purchase),
  };
}

export function mapBuyerPurchase(payload: OdooBuyerPurchase): BuyerPurchase {
  return {
    id: String(payload.id),
    name: payload.name,
    supplier: named(payload.supplier),
    state: payload.state,
    dateOrder: payload.date_order ?? null,
    currency: named(payload.currency),
    amountUntaxed: Number(payload.amount_untaxed ?? 0),
    amountTax: Number(payload.amount_tax ?? 0),
    amountTotal: Number(payload.amount_total ?? 0),
    buyer: named(payload.buyer),
    receiptCount: Number(payload.receipt_count ?? 0),
    receiptStates: payload.receipt_states ?? [],
    imageCount: Number(payload.image_count ?? 0),
    notes: payload.notes ?? null,
    lines: (payload.lines ?? []).map(mapPurchaseLine),
    receipts: (payload.receipts ?? []).map(mapReceiptSummary),
    images: (payload.images ?? []).map((image) => ({
      id: String(image.id),
      name: image.name,
      contentType: image.content_type ?? null,
      url: `/buyer-media/purchases/${payload.id}/images/${image.id}`,
    })),
  };
}

export function mapBuyerReceipt(payload: OdooBuyerReceipt): BuyerReceipt {
  return {
    ...mapReceiptSummary(payload),
    lines: (payload.lines ?? []).map((line) => ({
      moveId: String(line.move_id),
      product: {
        id: String(line.product.id),
        name: line.product.name,
        defaultCode: line.product.default_code ?? null,
      },
      orderedQty: Number(line.ordered_qty ?? 0),
      receivedQty: Number(line.received_qty ?? 0),
      remainingQty: Number(line.remaining_qty ?? 0),
      uom: named(line.uom),
      sourceLocation: named(line.source_location),
      destinationLocation: named(line.destination_location),
    })),
    backorderId: payload.backorder_id == null ? null : String(payload.backorder_id),
    backorders: (payload.backorders ?? []).map((row) => ({ id: String(row.id), name: row.name })),
  };
}

function supplierBody(input: BuyerSupplierInput) {
  return {
    name: input.name,
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.mobile ? { mobile: input.mobile } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.street ? { street: input.street } : {}),
    ...(input.street2 ? { street2: input.street2 } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(input.zip ? { zip: input.zip } : {}),
    ...(input.taxNumber ? { tax_number: input.taxNumber } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  };
}

function productBody(input: BuyerProductInput) {
  return {
    name: input.name,
    ...(input.defaultCode ? { default_code: input.defaultCode } : {}),
    ...(input.barcode ? { barcode: input.barcode } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.purchaseDescription ? { purchase_description: input.purchaseDescription } : {}),
    ...(input.uomId ? { uom_id: input.uomId } : {}),
    ...(input.uomPoId ? { uom_po_id: input.uomPoId } : {}),
    ...(input.imageBase64 ? { image_base64: input.imageBase64 } : {}),
    ...(input.imageContentType ? { image_content_type: input.imageContentType } : {}),
  };
}

function purchaseBody(input: BuyerPurchaseInput) {
  return {
    supplier_id: input.supplierId,
    ...(input.currencyId ? { currency_id: input.currencyId } : {}),
    ...(input.dateOrder ? { date_order: input.dateOrder } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
    ...(input.lines
      ? {
          lines: input.lines.map((line) => ({
            ...(line.id ? { id: line.id } : {}),
            product_id: line.productId,
            quantity: line.quantity,
            price_unit: line.priceUnit,
            ...(line.plannedDate ? { planned_date: line.plannedDate } : {}),
            ...(line.remove ? { remove: true } : {}),
          })),
        }
      : {}),
    ...(input.images
      ? {
          images: input.images.map((image) => ({
            ...(image.name ? { name: image.name } : {}),
            image_base64: image.imageBase64,
            image_content_type: image.imageContentType,
          })),
        }
      : {}),
  };
}

export async function listBuyerSuppliers(
  params: { q?: string; page?: number; pageSize?: number; sort?: string } = {},
  cookies?: OdooCookieAdapter,
): Promise<BuyerListResult<BuyerSupplier>> {
  const payload = await odooRequest<OdooBuyerPage<OdooBuyerSupplier>>(
    `/buyer/suppliers${qs({ q: params.q, page: params.page, page_size: params.pageSize, sort: params.sort })}`,
    { method: "GET", cookies, captureSetCookie: false },
  );
  const items = (payload?.items ?? []).map(mapBuyerSupplier);
  return { items, pagination: mapPagination(payload, items.length) };
}

export async function getBuyerSupplier(supplierId: number, cookies?: OdooCookieAdapter) {
  const payload = await odooRequest<OdooBuyerSupplier>(`/buyer/suppliers/${supplierId}`, {
    method: "GET",
    cookies,
    captureSetCookie: false,
  });
  return mapBuyerSupplier(payload);
}

export async function createBuyerSupplier(input: BuyerSupplierInput, cookies?: OdooCookieAdapter) {
  const payload = await odooRequest<OdooBuyerSupplier>("/buyer/suppliers", {
    method: "POST",
    cookies,
    captureSetCookie: false,
    body: supplierBody(input),
  });
  return mapBuyerSupplier(payload);
}

export async function updateBuyerSupplier(
  supplierId: number,
  input: BuyerSupplierInput,
  cookies?: OdooCookieAdapter,
) {
  const payload = await odooRequest<OdooBuyerSupplier>(`/buyer/suppliers/${supplierId}`, {
    method: "PATCH",
    cookies,
    captureSetCookie: false,
    body: supplierBody(input),
  });
  return mapBuyerSupplier(payload);
}

export async function listBuyerUoms(cookies?: OdooCookieAdapter) {
  const payload = await odooRequest<OdooBuyerUom[]>("/buyer/uoms", {
    method: "GET",
    cookies,
    captureSetCookie: false,
  });
  return (payload ?? []).map(mapBuyerUom);
}

export async function listBuyerProducts(
  params: {
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    categoryId?: number;
    includeChildren?: boolean;
  } = {},
  cookies?: OdooCookieAdapter,
): Promise<BuyerListResult<BuyerProduct>> {
  const payload = await odooRequest<OdooBuyerPage<OdooBuyerProduct>>(
    `/buyer/products${qs({
      q: params.q,
      page: params.page,
      page_size: params.pageSize,
      sort: params.sort,
      category_id: params.categoryId,
      include_children: params.includeChildren == null ? undefined : params.includeChildren ? "true" : "false",
    })}`,
    { method: "GET", cookies, captureSetCookie: false },
  );
  const items = (payload?.items ?? []).map(mapBuyerProduct);
  return { items, pagination: mapPagination(payload, items.length) };
}

/** Prefer server `category_id` filter; fall back to client raw-material match. */
export async function listBuyerRawProducts(
  params: { q?: string; page?: number; pageSize?: number; sort?: string } = {},
  cookies?: OdooCookieAdapter,
): Promise<BuyerListResult<BuyerProduct>> {
  const pageSize = params.pageSize ?? 100;
  const probe = await listBuyerProducts(
    { ...params, page: 1, pageSize, sort: params.sort ?? "name_asc" },
    cookies,
  );
  const rawCategoryId = probe.items.find((product) => isBuyerRawMaterialProduct(product))?.category?.id;
  if (rawCategoryId) {
    const filtered = await listBuyerProducts(
      {
        ...params,
        page: params.page ?? 1,
        pageSize,
        sort: params.sort ?? "name_asc",
        categoryId: Number(rawCategoryId),
      },
      cookies,
    );
    return {
      ...filtered,
      items: filtered.items.filter(isBuyerRawMaterialProduct),
    };
  }
  return {
    ...probe,
    items: probe.items.filter(isBuyerRawMaterialProduct),
    pagination: {
      ...probe.pagination,
      total: probe.items.filter(isBuyerRawMaterialProduct).length,
    },
  };
}

export async function getBuyerProduct(productId: number, cookies?: OdooCookieAdapter) {
  const payload = await odooRequest<OdooBuyerProduct>(`/buyer/products/${productId}`, {
    method: "GET",
    cookies,
    captureSetCookie: false,
  });
  return mapBuyerProduct(payload);
}

export async function createBuyerProduct(input: BuyerProductInput, cookies?: OdooCookieAdapter) {
  const payload = await odooRequest<OdooBuyerProduct>("/buyer/products", {
    method: "POST",
    cookies,
    captureSetCookie: false,
    body: productBody(input),
  });
  return mapBuyerProduct(payload);
}

export async function listBuyerPurchases(
  params: { q?: string; page?: number; pageSize?: number; state?: string; supplierId?: number; sort?: string } = {},
  cookies?: OdooCookieAdapter,
): Promise<BuyerListResult<BuyerPurchase>> {
  const payload = await odooRequest<OdooBuyerPage<OdooBuyerPurchase>>(
    `/buyer/purchases${qs({
      q: params.q,
      page: params.page,
      page_size: params.pageSize,
      state: params.state,
      supplier_id: params.supplierId,
      sort: params.sort,
    })}`,
    { method: "GET", cookies, captureSetCookie: false },
  );
  const items = (payload?.items ?? []).map(mapBuyerPurchase);
  return { items, pagination: mapPagination(payload, items.length) };
}

export async function getBuyerPurchase(purchaseId: number, cookies?: OdooCookieAdapter) {
  const payload = await odooRequest<OdooBuyerPurchase>(`/buyer/purchases/${purchaseId}`, {
    method: "GET",
    cookies,
    captureSetCookie: false,
  });
  return mapBuyerPurchase(payload);
}

export async function createBuyerPurchase(input: BuyerPurchaseInput, cookies?: OdooCookieAdapter) {
  const payload = await odooRequest<OdooBuyerPurchase>("/buyer/purchases", {
    method: "POST",
    cookies,
    captureSetCookie: false,
    body: purchaseBody(input),
  });
  return mapBuyerPurchase(payload);
}

export async function updateBuyerPurchase(
  purchaseId: number,
  input: BuyerPurchaseInput,
  cookies?: OdooCookieAdapter,
) {
  const payload = await odooRequest<OdooBuyerPurchase>(`/buyer/purchases/${purchaseId}`, {
    method: "PATCH",
    cookies,
    captureSetCookie: false,
    body: purchaseBody(input),
  });
  return mapBuyerPurchase(payload);
}

export async function confirmBuyerPurchase(purchaseId: number, cookies?: OdooCookieAdapter) {
  const payload = await odooRequest<OdooBuyerPurchase>(`/buyer/purchases/${purchaseId}/confirm`, {
    method: "POST",
    cookies,
    captureSetCookie: false,
    body: {},
  });
  return mapBuyerPurchase(payload);
}

export async function listBuyerReceipts(
  params: { q?: string; page?: number; pageSize?: number; status?: string; sort?: string } = {},
  cookies?: OdooCookieAdapter,
): Promise<BuyerListResult<BuyerReceiptSummary>> {
  const payload = await odooRequest<OdooBuyerPage<OdooBuyerReceipt>>(
    `/buyer/receipts${qs({
      q: params.q,
      page: params.page,
      page_size: params.pageSize,
      status: params.status,
      sort: params.sort,
    })}`,
    { method: "GET", cookies, captureSetCookie: false },
  );
  const items = (payload?.items ?? []).map(mapReceiptSummary);
  return { items, pagination: mapPagination(payload, items.length) };
}

export async function getBuyerReceipt(pickingId: number, cookies?: OdooCookieAdapter) {
  const payload = await odooRequest<OdooBuyerReceipt>(`/buyer/receipts/${pickingId}`, {
    method: "GET",
    cookies,
    captureSetCookie: false,
  });
  return mapBuyerReceipt(payload);
}

export async function receiveBuyerReceipt(
  pickingId: number,
  lines: Array<{ moveId: number; quantityDone: number }>,
  cookies?: OdooCookieAdapter,
) {
  const payload = await odooRequest<OdooBuyerReceipt>(`/buyer/receipts/${pickingId}/receive`, {
    method: "POST",
    cookies,
    captureSetCookie: false,
    body: {
      lines: lines.map((line) => ({
        move_id: line.moveId,
        quantity_done: line.quantityDone,
      })),
    },
  });
  return mapBuyerReceipt(payload);
}

export function isPurchaseEditable(state: string) {
  return state === "draft" || state === "sent" || state === "to approve";
}

export const BUYER_NAME_SORTS = ["name_asc", "name_desc", "newest", "oldest"] as const;
export type BuyerNameSort = (typeof BUYER_NAME_SORTS)[number];
export const BUYER_DATE_SORTS = ["newest", "oldest"] as const;
export type BuyerDateSort = (typeof BUYER_DATE_SORTS)[number];
export const BUYER_PURCHASE_STATES = ["draft", "sent", "to approve", "purchase", "done", "cancel"] as const;
export type BuyerPurchaseState = (typeof BUYER_PURCHASE_STATES)[number];
export const BUYER_RECEIPT_STATUSES = ["draft", "waiting", "confirmed", "assigned", "done", "cancel"] as const;
export type BuyerReceiptStatus = (typeof BUYER_RECEIPT_STATUSES)[number];

export type BuyerListQuery = {
  q?: string;
  page?: string;
  sort?: string;
  state?: string;
  status?: string;
  error?: string;
};

export function parseBuyerPage(value?: string): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function parseBuyerNameSort(value?: string): BuyerNameSort | undefined {
  return BUYER_NAME_SORTS.includes(value as BuyerNameSort) ? (value as BuyerNameSort) : undefined;
}

export function parseBuyerDateSort(value?: string): BuyerDateSort | undefined {
  return BUYER_DATE_SORTS.includes(value as BuyerDateSort) ? (value as BuyerDateSort) : undefined;
}

export function parseBuyerPurchaseState(value?: string): BuyerPurchaseState | undefined {
  return BUYER_PURCHASE_STATES.includes(value as BuyerPurchaseState)
    ? (value as BuyerPurchaseState)
    : undefined;
}

export function parseBuyerReceiptStatus(value?: string): BuyerReceiptStatus | undefined {
  return BUYER_RECEIPT_STATUSES.includes(value as BuyerReceiptStatus)
    ? (value as BuyerReceiptStatus)
    : undefined;
}

function buyerListHref(
  basePath: string,
  query: BuyerListQuery,
  overrides: Partial<BuyerListQuery>,
  options: {
    allowSort?: "name" | "date";
    allowState?: boolean;
    allowStatus?: boolean;
  } = {},
) {
  const merged: BuyerListQuery = { ...query, ...overrides };
  const params = new URLSearchParams();
  const q = merged.q?.trim();
  if (q) params.set("q", q);
  if (options.allowSort === "name") {
    const sort = parseBuyerNameSort(merged.sort);
    if (sort) params.set("sort", sort);
  }
  if (options.allowSort === "date") {
    const sort = parseBuyerDateSort(merged.sort);
    if (sort) params.set("sort", sort);
  }
  if (options.allowState) {
    const state = parseBuyerPurchaseState(merged.state);
    if (state) params.set("state", state);
  }
  if (options.allowStatus) {
    const status = parseBuyerReceiptStatus(merged.status);
    if (status) params.set("status", status);
  }
  const page = parseBuyerPage(merged.page);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

export function buyerSuppliersHref(query: BuyerListQuery, overrides: Partial<BuyerListQuery> = {}) {
  return buyerListHref("/account/buyer/suppliers", query, overrides, { allowSort: "name" });
}

export function buyerProductsHref(query: BuyerListQuery, overrides: Partial<BuyerListQuery> = {}) {
  return buyerListHref("/account/buyer/products", query, overrides, { allowSort: "name" });
}

export function buyerPurchasesHref(query: BuyerListQuery, overrides: Partial<BuyerListQuery> = {}) {
  return buyerListHref("/account/buyer/purchases", query, overrides, {
    allowSort: "date",
    allowState: true,
  });
}

export function buyerReceiptsHref(query: BuyerListQuery, overrides: Partial<BuyerListQuery> = {}) {
  return buyerListHref("/account/buyer/receipts", query, overrides, {
    allowSort: "date",
    allowStatus: true,
  });
}
