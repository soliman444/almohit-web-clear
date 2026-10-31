import { odooRequest } from "./client";
import type { OdooCookieAdapter, OdooPaginatedList, WarehouseAccess } from "./types";
import { mapWarehouseAccess } from "./types";

export type WhNamed = {
  id: string;
  name: string;
};

export type WhProductRef = {
  id: string;
  name: string;
  defaultCode: string | null;
  barcode?: string | null;
  uom?: WhNamed | null;
};

export type WhDashboard = {
  warehouseCount: number;
  productsInStock: number;
  pendingReceipts: number;
  pendingIssues: number;
  incomingTransfers: number;
  outgoingTransfers: number;
  stockVariances: number;
  warehouses: WhNamed[];
  defaultWarehouseId: string | null;
  permissions: string[];
};

export type WhStockRow = {
  id: string;
  product: WhProductRef;
  warehouse: WhNamed | null;
  location: WhNamed | null;
  quantity: number;
  reserved: number;
  available: number;
};

export type WhReceiptSummary = {
  id: string;
  name: string;
  state: string;
  scheduledDate: string | null;
  dateDone: string | null;
  partner: WhNamed | null;
  purchase: WhNamed | null;
  isReturn: boolean;
  origin: string | null;
  warehouse: WhNamed | null;
};

export type WhReceiptLine = {
  moveId: string;
  product: WhProductRef;
  orderedQty: number;
  receivedQty: number;
  remainingQty: number;
  uom: WhNamed | null;
  sourceLocation: WhNamed | null;
  destinationLocation: WhNamed | null;
};

export type WhReceipt = WhReceiptSummary & {
  lines: WhReceiptLine[];
  backorderId: string | null;
  backorders: WhNamed[];
};

export type WhIssueSummary = {
  id: string;
  name: string;
  state: string;
  dispatchState: string;
  scheduledDate: string | null;
  dateDone: string | null;
  customer: WhNamed | null;
  saleOrder: WhNamed | null;
  origin: string | null;
  warehouse: WhNamed | null;
  paymentOk: boolean;
};

export type WhIssueLine = {
  moveId: string;
  product: WhProductRef;
  orderedQty: number;
  reservedQty: number;
  doneQty: number;
  remainingQty: number;
  uom: WhNamed | null;
  sourceLocation: WhNamed | null;
  destinationLocation: WhNamed | null;
};

export type WhIssue = WhIssueSummary & {
  lines: WhIssueLine[];
  dispatchPickingId: string | null;
};

export type WhTransferLine = {
  id: string;
  product: WhProductRef;
  uom: WhNamed | null;
  qtyRequested: number;
  qtyDispatched: number;
  qtyReceived: number;
  sourceLocation: WhNamed | null;
  destLocation: WhNamed | null;
};

export type WhDiscrepancy = {
  id: string;
  product: WhNamed | null;
  qtyExpected: number;
  qtyReceived: number;
  qtyDifference: number;
  reason: string;
  state: string;
  note: string | null;
};

export type WhTransferSummary = {
  id: string;
  name: string;
  state: string;
  sourceWarehouse: WhNamed | null;
  destWarehouse: WhNamed | null;
  requestedBy: WhNamed | null;
  dispatchedBy: WhNamed | null;
  receivedBy: WhNamed | null;
  requestedAt: string | null;
  dispatchedAt: string | null;
  receivedAt: string | null;
  note: string | null;
  openDiscrepancies: number;
};

export type WhTransfer = WhTransferSummary & {
  lines: WhTransferLine[];
  discrepancies: WhDiscrepancy[];
  dispatchPickingId: string | null;
  receivePickingId: string | null;
};

export type WhInventoryLine = {
  id: string;
  rowNumber: number;
  product: WhProductRef;
  uom: WhNamed | null;
  qtyOnHand: number;
  qtyCounted: number;
  qtyDifference: number;
  note: string | null;
};

export type WhInventorySummary = {
  id: string;
  name: string;
  state: string;
  sessionType: string;
  warehouse: WhNamed | null;
  location: WhNamed | null;
  sourceFilename: string | null;
  createdBy: WhNamed | null;
  approvedBy: WhNamed | null;
  approvedAt: string | null;
  lineCount: number;
};

export type WhInventorySession = WhInventorySummary & {
  lines: WhInventoryLine[];
  note: string | null;
};

export type WhPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

type OdooNamed = { id: number; name: string } | null | undefined;

type OdooPage<T> = OdooPaginatedList<T> & {
  pagination?: {
    page?: number;
    page_size?: number;
    total?: number;
    pages?: number;
  };
};

function named(rel: OdooNamed): WhNamed | null {
  if (!rel || typeof rel.id !== "number" || !rel.name) return null;
  return { id: String(rel.id), name: rel.name };
}

function productRef(raw: {
  id: number;
  name: string;
  default_code?: string | null;
  barcode?: string | null;
  uom?: OdooNamed;
} | null | undefined): WhProductRef {
  return {
    id: String(raw?.id ?? 0),
    name: raw?.name ?? "—",
    defaultCode: raw?.default_code ?? null,
    barcode: raw?.barcode ?? null,
    uom: named(raw?.uom),
  };
}

function pageOf<T, R>(payload: OdooPage<T>, map: (row: T) => R): WhPage<R> {
  const pagination = payload.pagination ?? {};
  return {
    items: (payload.items ?? []).map(map),
    page: pagination.page ?? 1,
    pageSize: pagination.page_size ?? 20,
    total: pagination.total ?? (payload.items ?? []).length,
    pages: pagination.pages ?? 1,
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

function mapReceipt(row: {
  id: number;
  name: string;
  state: string;
  scheduled_date?: string | null;
  date_done?: string | null;
  partner?: OdooNamed;
  purchase?: OdooNamed;
  is_return?: boolean;
  origin?: string | null;
  warehouse?: OdooNamed;
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
}): WhReceipt {
  return {
    id: String(row.id),
    name: row.name,
    state: row.state,
    scheduledDate: row.scheduled_date ?? null,
    dateDone: row.date_done ?? null,
    partner: named(row.partner),
    purchase: named(row.purchase),
    isReturn: Boolean(row.is_return),
    origin: row.origin ?? null,
    warehouse: named(row.warehouse),
    lines: (row.lines ?? []).map((line) => ({
      moveId: String(line.move_id),
      product: productRef(line.product),
      orderedQty: Number(line.ordered_qty ?? 0),
      receivedQty: Number(line.received_qty ?? 0),
      remainingQty: Number(line.remaining_qty ?? 0),
      uom: named(line.uom),
      sourceLocation: named(line.source_location),
      destinationLocation: named(line.destination_location),
    })),
    backorderId: row.backorder_id != null ? String(row.backorder_id) : null,
    backorders: (row.backorders ?? []).map((bo) => ({ id: String(bo.id), name: bo.name })),
  };
}

function mapIssue(row: {
  id: number;
  name: string;
  state: string;
  dispatch_state?: string;
  scheduled_date?: string | null;
  date_done?: string | null;
  customer?: OdooNamed;
  sale_order?: OdooNamed;
  origin?: string | null;
  warehouse?: OdooNamed;
  payment_ok?: boolean;
  lines?: Array<{
    move_id: number;
    product: { id: number; name: string; default_code?: string | null };
    ordered_qty: number;
    reserved_qty?: number;
    done_qty?: number;
    remaining_qty: number;
    uom?: OdooNamed;
    source_location?: OdooNamed;
    destination_location?: OdooNamed;
  }>;
  dispatch_picking_id?: number | null;
}): WhIssue {
  return {
    id: String(row.id),
    name: row.name,
    state: row.state,
    dispatchState: row.dispatch_state || "pending",
    scheduledDate: row.scheduled_date ?? null,
    dateDone: row.date_done ?? null,
    customer: named(row.customer),
    saleOrder: named(row.sale_order),
    origin: row.origin ?? null,
    warehouse: named(row.warehouse),
    paymentOk: row.payment_ok !== false,
    lines: (row.lines ?? []).map((line) => ({
      moveId: String(line.move_id),
      product: productRef(line.product),
      orderedQty: Number(line.ordered_qty ?? 0),
      reservedQty: Number(line.reserved_qty ?? 0),
      doneQty: Number(line.done_qty ?? 0),
      remainingQty: Number(line.remaining_qty ?? 0),
      uom: named(line.uom),
      sourceLocation: named(line.source_location),
      destinationLocation: named(line.destination_location),
    })),
    dispatchPickingId: row.dispatch_picking_id != null ? String(row.dispatch_picking_id) : null,
  };
}

function mapTransfer(row: {
  id: number;
  name: string;
  state: string;
  source_warehouse?: OdooNamed;
  dest_warehouse?: OdooNamed;
  requested_by?: OdooNamed;
  dispatched_by?: OdooNamed;
  received_by?: OdooNamed;
  requested_at?: string | null;
  dispatched_at?: string | null;
  received_at?: string | null;
  note?: string | null;
  open_discrepancies?: number;
  lines?: Array<{
    id: number;
    product: { id: number; name: string; default_code?: string | null };
    uom?: OdooNamed;
    qty_requested: number;
    qty_dispatched: number;
    qty_received: number;
    source_location?: OdooNamed;
    dest_location?: OdooNamed;
  }>;
  discrepancies?: Array<{
    id: number;
    product?: OdooNamed;
    qty_expected: number;
    qty_received: number;
    qty_difference: number;
    reason: string;
    state: string;
    note?: string | null;
  }>;
  dispatch_picking_id?: number | null;
  receive_picking_id?: number | null;
}): WhTransfer {
  return {
    id: String(row.id),
    name: row.name,
    state: row.state,
    sourceWarehouse: named(row.source_warehouse),
    destWarehouse: named(row.dest_warehouse),
    requestedBy: named(row.requested_by),
    dispatchedBy: named(row.dispatched_by),
    receivedBy: named(row.received_by),
    requestedAt: row.requested_at ?? null,
    dispatchedAt: row.dispatched_at ?? null,
    receivedAt: row.received_at ?? null,
    note: row.note ?? null,
    openDiscrepancies: Number(row.open_discrepancies ?? 0),
    lines: (row.lines ?? []).map((line) => ({
      id: String(line.id),
      product: productRef(line.product),
      uom: named(line.uom),
      qtyRequested: Number(line.qty_requested ?? 0),
      qtyDispatched: Number(line.qty_dispatched ?? 0),
      qtyReceived: Number(line.qty_received ?? 0),
      sourceLocation: named(line.source_location),
      destLocation: named(line.dest_location),
    })),
    discrepancies: (row.discrepancies ?? []).map((d) => ({
      id: String(d.id),
      product: named(d.product),
      qtyExpected: Number(d.qty_expected ?? 0),
      qtyReceived: Number(d.qty_received ?? 0),
      qtyDifference: Number(d.qty_difference ?? 0),
      reason: d.reason,
      state: d.state,
      note: d.note ?? null,
    })),
    dispatchPickingId: row.dispatch_picking_id != null ? String(row.dispatch_picking_id) : null,
    receivePickingId: row.receive_picking_id != null ? String(row.receive_picking_id) : null,
  };
}

function mapInventory(row: {
  id: number;
  name: string;
  state: string;
  session_type?: string;
  warehouse?: OdooNamed;
  location?: OdooNamed;
  source_filename?: string | null;
  created_by?: OdooNamed;
  approved_by?: OdooNamed;
  approved_at?: string | null;
  line_count?: number;
  note?: string | null;
  lines?: Array<{
    id: number;
    row_number: number;
    product: {
      id: number;
      name: string;
      default_code?: string | null;
      barcode?: string | null;
    };
    uom?: OdooNamed;
    qty_on_hand: number;
    qty_counted: number;
    qty_difference: number;
    note?: string | null;
  }>;
}): WhInventorySession {
  return {
    id: String(row.id),
    name: row.name,
    state: row.state,
    sessionType: row.session_type || "count",
    warehouse: named(row.warehouse),
    location: named(row.location),
    sourceFilename: row.source_filename ?? null,
    createdBy: named(row.created_by),
    approvedBy: named(row.approved_by),
    approvedAt: row.approved_at ?? null,
    lineCount: Number(row.line_count ?? 0),
    note: row.note ?? null,
    lines: (row.lines ?? []).map((line) => ({
      id: String(line.id),
      rowNumber: Number(line.row_number ?? 0),
      product: productRef(line.product),
      uom: named(line.uom),
      qtyOnHand: Number(line.qty_on_hand ?? 0),
      qtyCounted: Number(line.qty_counted ?? 0),
      qtyDifference: Number(line.qty_difference ?? 0),
      note: line.note ?? null,
    })),
  };
}

export async function getWarehouseDashboard(cookies?: OdooCookieAdapter): Promise<WhDashboard> {
  const data = await odooRequest<{
    warehouse_count?: number;
    products_in_stock?: number;
    pending_receipts?: number;
    pending_issues?: number;
    incoming_transfers?: number;
    outgoing_transfers?: number;
    stock_variances?: number;
    warehouses?: Array<{ id: number; name: string }>;
    default_warehouse_id?: number | null;
    permissions?: string[];
  }>("/warehouse/dashboard", { cookies });
  const access = mapWarehouseAccess({
    warehouses: data.warehouses,
    default_warehouse_id: data.default_warehouse_id,
    permissions: data.permissions,
  });
  return {
    warehouseCount: Number(data.warehouse_count ?? 0),
    productsInStock: Number(data.products_in_stock ?? 0),
    pendingReceipts: Number(data.pending_receipts ?? 0),
    pendingIssues: Number(data.pending_issues ?? 0),
    incomingTransfers: Number(data.incoming_transfers ?? 0),
    outgoingTransfers: Number(data.outgoing_transfers ?? 0),
    stockVariances: Number(data.stock_variances ?? 0),
    warehouses: access?.warehouses ?? [],
    defaultWarehouseId: access?.defaultWarehouseId ?? null,
    permissions: access?.permissions ?? [],
  };
}

export async function getMyWarehouses(cookies?: OdooCookieAdapter): Promise<WarehouseAccess> {
  const data = await odooRequest<{
    warehouses?: Array<{ id: number; name: string }>;
    default_warehouse_id?: number | null;
    permissions?: string[];
  }>("/warehouse/my-warehouses", { cookies });
  return mapWarehouseAccess(data) ?? {
    warehouses: [],
    defaultWarehouseId: null,
    permissions: [],
  };
}

export async function listWarehouseStock(
  params: { warehouseId?: string | number; productId?: string | number; page?: number; pageSize?: number } = {},
  cookies?: OdooCookieAdapter,
): Promise<WhPage<WhStockRow>> {
  const data = await odooRequest<OdooPage<{
    id: number;
    product: {
      id: number;
      name: string;
      default_code?: string | null;
      barcode?: string | null;
      uom?: OdooNamed;
    };
    warehouse?: OdooNamed;
    location?: OdooNamed;
    quantity?: number;
    reserved_quantity?: number;
    available_quantity?: number;
  }>>(
    `/warehouse/stock${qs({
      warehouse_id: params.warehouseId,
      product_id: params.productId,
      page: params.page,
      page_size: params.pageSize,
    })}`,
    { cookies },
  );
  return pageOf(data, (row) => ({
    id: String(row.id),
    product: productRef(row.product),
    warehouse: named(row.warehouse),
    location: named(row.location),
    quantity: Number(row.quantity ?? 0),
    reserved: Number(row.reserved_quantity ?? 0),
    available: Number(row.available_quantity ?? row.quantity ?? 0),
  }));
}

export async function listWarehouseReceipts(
  params: { status?: string; kind?: string; page?: number; pageSize?: number } = {},
  cookies?: OdooCookieAdapter,
): Promise<WhPage<WhReceiptSummary>> {
  const data = await odooRequest<OdooPage<Parameters<typeof mapReceipt>[0]>>(
    `/warehouse/receipts${qs({
      status: params.status,
      kind: params.kind,
      page: params.page,
      page_size: params.pageSize,
    })}`,
    { cookies },
  );
  return pageOf(data, (row) => {
    const full = mapReceipt(row);
    const { lines: _lines, backorderId: _b, backorders: _bo, ...summary } = full;
    return summary;
  });
}

export async function getWarehouseReceipt(id: number, cookies?: OdooCookieAdapter): Promise<WhReceipt> {
  const data = await odooRequest<Parameters<typeof mapReceipt>[0]>(`/warehouse/receipts/${id}`, { cookies });
  return mapReceipt(data);
}

export async function receiveWarehouseReceipt(
  id: number,
  lines: Array<{ moveId: string | number; quantityDone: number }>,
  cookies?: OdooCookieAdapter,
): Promise<WhReceipt> {
  const data = await odooRequest<Parameters<typeof mapReceipt>[0]>(`/warehouse/receipts/${id}/receive`, {
    method: "POST",
    body: {
      lines: lines.map((line) => ({
        move_id: Number(line.moveId),
        quantity_done: line.quantityDone,
      })),
    },
    cookies,
  });
  return mapReceipt(data);
}

export async function listWarehouseIssues(
  params: { status?: string; page?: number; pageSize?: number } = {},
  cookies?: OdooCookieAdapter,
): Promise<WhPage<WhIssueSummary>> {
  const data = await odooRequest<OdooPage<Parameters<typeof mapIssue>[0]>>(
    `/warehouse/issues${qs({
      status: params.status,
      page: params.page,
      page_size: params.pageSize,
    })}`,
    { cookies },
  );
  return pageOf(data, (row) => {
    const full = mapIssue(row);
    const { lines: _lines, dispatchPickingId: _d, ...summary } = full;
    return summary;
  });
}

export async function getWarehouseIssue(id: number, cookies?: OdooCookieAdapter): Promise<WhIssue> {
  const data = await odooRequest<Parameters<typeof mapIssue>[0]>(`/warehouse/issues/${id}`, { cookies });
  return mapIssue(data);
}

export async function dispatchWarehouseIssue(
  id: number,
  lines: Array<{ moveId: string | number; quantityDone: number; locationId?: string | number }>,
  cookies?: OdooCookieAdapter,
): Promise<WhIssue> {
  const data = await odooRequest<Parameters<typeof mapIssue>[0]>(`/warehouse/issues/${id}/dispatch`, {
    method: "POST",
    body: {
      lines: lines.map((line) => ({
        move_id: Number(line.moveId),
        quantity_done: line.quantityDone,
        ...(line.locationId ? { location_id: Number(line.locationId) } : {}),
      })),
    },
    cookies,
  });
  return mapIssue(data);
}

export async function listWarehouseTransfers(
  params: { direction?: string; status?: string; page?: number; pageSize?: number } = {},
  cookies?: OdooCookieAdapter,
): Promise<WhPage<WhTransferSummary>> {
  const data = await odooRequest<OdooPage<Parameters<typeof mapTransfer>[0]>>(
    `/warehouse/transfers${qs({
      direction: params.direction,
      status: params.status,
      page: params.page,
      page_size: params.pageSize,
    })}`,
    { cookies },
  );
  return pageOf(data, (row) => {
    const full = mapTransfer(row);
    const { lines: _l, discrepancies: _d, dispatchPickingId: _dp, receivePickingId: _rp, ...summary } = full;
    return summary;
  });
}

export async function getWarehouseTransfer(id: number, cookies?: OdooCookieAdapter): Promise<WhTransfer> {
  const data = await odooRequest<Parameters<typeof mapTransfer>[0]>(`/warehouse/transfers/${id}`, { cookies });
  return mapTransfer(data);
}

export async function createWarehouseTransfer(
  input: {
    sourceWarehouseId: number;
    destWarehouseId: number;
    note?: string;
    lines: Array<{ productId: number; quantity: number; uomId?: number; locationId?: number }>;
  },
  cookies?: OdooCookieAdapter,
): Promise<WhTransfer> {
  const data = await odooRequest<Parameters<typeof mapTransfer>[0]>("/warehouse/transfers", {
    method: "POST",
    body: {
      source_warehouse_id: input.sourceWarehouseId,
      dest_warehouse_id: input.destWarehouseId,
      note: input.note || undefined,
      lines: input.lines.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
        ...(line.uomId ? { uom_id: line.uomId } : {}),
        ...(line.locationId ? { location_id: line.locationId } : {}),
      })),
    },
    cookies,
  });
  return mapTransfer(data);
}

export async function dispatchWarehouseTransfer(
  id: number,
  lines?: Array<{ lineId: string | number; quantity: number }>,
  cookies?: OdooCookieAdapter,
): Promise<WhTransfer> {
  const data = await odooRequest<Parameters<typeof mapTransfer>[0]>(`/warehouse/transfers/${id}/dispatch`, {
    method: "POST",
    body: lines
      ? {
          lines: lines.map((line) => ({
            line_id: Number(line.lineId),
            quantity: line.quantity,
          })),
        }
      : {},
    cookies,
  });
  return mapTransfer(data);
}

export async function receiveWarehouseTransfer(
  id: number,
  lines: Array<{ lineId: string | number; quantity: number }>,
  cookies?: OdooCookieAdapter,
): Promise<WhTransfer> {
  const data = await odooRequest<Parameters<typeof mapTransfer>[0]>(`/warehouse/transfers/${id}/receive`, {
    method: "POST",
    body: {
      lines: lines.map((line) => ({
        line_id: Number(line.lineId),
        quantity: line.quantity,
      })),
    },
    cookies,
  });
  return mapTransfer(data);
}

export async function cancelWarehouseTransfer(id: number, cookies?: OdooCookieAdapter): Promise<WhTransfer> {
  const data = await odooRequest<Parameters<typeof mapTransfer>[0]>(`/warehouse/transfers/${id}/cancel`, {
    method: "POST",
    body: {},
    cookies,
  });
  return mapTransfer(data);
}

export async function listWarehouseInventory(
  params: { status?: string; sessionType?: string; page?: number; pageSize?: number } = {},
  cookies?: OdooCookieAdapter,
): Promise<WhPage<WhInventorySummary>> {
  const data = await odooRequest<OdooPage<Parameters<typeof mapInventory>[0]>>(
    `/warehouse/inventory${qs({
      status: params.status,
      session_type: params.sessionType,
      page: params.page,
      page_size: params.pageSize,
    })}`,
    { cookies },
  );
  return pageOf(data, (row) => {
    const full = mapInventory(row);
    const { lines: _l, note: _n, ...summary } = full;
    return summary;
  });
}

export async function getWarehouseInventory(
  id: number,
  cookies?: OdooCookieAdapter,
): Promise<WhInventorySession> {
  const data = await odooRequest<Parameters<typeof mapInventory>[0]>(`/warehouse/inventory/${id}`, { cookies });
  return mapInventory(data);
}

export async function importWarehouseInventory(
  input: {
    warehouseId: number;
    locationId?: number;
    sessionType?: "count" | "opening";
    filename: string;
    fileBase64: string;
  },
  cookies?: OdooCookieAdapter,
): Promise<WhInventorySession> {
  const data = await odooRequest<Parameters<typeof mapInventory>[0]>("/warehouse/inventory/import", {
    method: "POST",
    body: {
      warehouse_id: input.warehouseId,
      ...(input.locationId ? { location_id: input.locationId } : {}),
      session_type: input.sessionType || "count",
      filename: input.filename,
      file_base64: input.fileBase64,
    },
    cookies,
  });
  return mapInventory(data);
}

export async function approveWarehouseInventory(
  id: number,
  cookies?: OdooCookieAdapter,
): Promise<WhInventorySession> {
  const data = await odooRequest<Parameters<typeof mapInventory>[0]>(`/warehouse/inventory/${id}/approve`, {
    method: "POST",
    body: {},
    cookies,
  });
  return mapInventory(data);
}
