"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mapApiClientFormError, redirectFormError } from "../form-errors";
import { parseOdooRecordId } from "../odoo/catalog";
import {
  approveWarehouseInventory,
  cancelWarehouseTransfer,
  createWarehouseTransfer,
  dispatchWarehouseIssue,
  dispatchWarehouseTransfer,
  importWarehouseInventory,
  receiveWarehouseReceipt,
  receiveWarehouseTransfer,
} from "../odoo/warehouse";
import { requireWarehouseManager } from "../session/access";

function value(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function mapWhError(error: unknown, fallbackPath: string): never {
  mapApiClientFormError(error, {
    fallbackPath,
    fallbackCode: "failed",
    known: {
      RECEIPT_NOT_FOUND: { code: "notfound", path: "/account/warehouse/receipts" },
      ISSUE_NOT_FOUND: { code: "notfound", path: "/account/warehouse/issues" },
      TRANSFER_NOT_FOUND: { code: "notfound", path: "/account/warehouse/transfers" },
      INVENTORY_NOT_FOUND: { code: "notfound", path: "/account/warehouse/inventory" },
      INVALID_RECEIPT_QUANTITY: { code: "qty", fields: ["quantityDone"] },
      INVALID_FIELDS: { code: "invalid", fields: ["quantityDone", "lines"] },
      WAREHOUSE_PERMISSION_DENIED: { code: "permission" },
      WAREHOUSE_ASSIGNMENT_REQUIRED: { code: "warehouse", path: "/account/warehouse" },
      WAREHOUSE_NOT_ALLOWED: { code: "warehouse", fields: ["warehouseId"] },
      IMPORT_DUPLICATE: { code: "duplicate", fields: ["file"] },
      RECEIPT_NOT_READY: { code: "failed", fields: ["quantityDone"] },
      ISSUE_NOT_READY: { code: "failed", fields: ["quantityDone"] },
      TRANSFER_INVALID_STATE: { code: "failed" },
    },
  });
}

function parseMoveQtyLines(formData: FormData) {
  const moveIds = formData.getAll("moveId").map((v) => String(v).trim());
  const qtys = formData.getAll("quantityDone").map((v) => String(v).trim());
  const lines: Array<{ moveId: string; quantityDone: number }> = [];
  for (let i = 0; i < moveIds.length; i += 1) {
    const moveId = moveIds[i];
    const qty = Number(qtys[i]);
    if (!moveId || !Number.isFinite(qty) || qty < 0) continue;
    lines.push({ moveId, quantityDone: qty });
  }
  return lines;
}

function parseTransferQtyLines(formData: FormData) {
  const lineIds = formData.getAll("lineId").map((v) => String(v).trim());
  const qtys = formData.getAll("quantity").map((v) => String(v).trim());
  const lines: Array<{ lineId: string; quantity: number }> = [];
  for (let i = 0; i < lineIds.length; i += 1) {
    const lineId = lineIds[i];
    const qty = Number(qtys[i]);
    if (!lineId || !Number.isFinite(qty) || qty < 0) continue;
    lines.push({ lineId, quantity: qty });
  }
  return lines;
}

export async function receiveWarehouseReceiptAction(formData: FormData) {
  await requireWarehouseManager();
  const pickingId = parseOdooRecordId(value(formData, "pickingId"));
  const fallback = pickingId
    ? `/account/warehouse/receipts/${pickingId}`
    : "/account/warehouse/receipts";
  if (!pickingId) redirectFormError(fallback, { code: "notfound" });
  const lines = parseMoveQtyLines(formData);
  if (!lines.length) {
    redirectFormError(fallback, { code: "qty", fields: ["quantityDone"] });
  }
  try {
    await receiveWarehouseReceipt(pickingId, lines);
  } catch (error) {
    mapWhError(error, fallback);
  }
  revalidatePath("/account/warehouse");
  revalidatePath("/account/warehouse/receipts");
  revalidatePath(fallback);
  redirect(`${fallback}?received=1`);
}

export async function dispatchWarehouseIssueAction(formData: FormData) {
  await requireWarehouseManager();
  const pickingId = parseOdooRecordId(value(formData, "pickingId"));
  const fallback = pickingId
    ? `/account/warehouse/issues/${pickingId}`
    : "/account/warehouse/issues";
  if (!pickingId) redirectFormError(fallback, { code: "notfound" });
  const lines = parseMoveQtyLines(formData);
  if (!lines.length) {
    redirectFormError(fallback, { code: "qty", fields: ["quantityDone"] });
  }
  try {
    await dispatchWarehouseIssue(pickingId, lines);
  } catch (error) {
    mapWhError(error, fallback);
  }
  revalidatePath("/account/warehouse");
  revalidatePath("/account/warehouse/issues");
  revalidatePath(fallback);
  redirect(`${fallback}?dispatched=1`);
}

export async function createWarehouseTransferAction(formData: FormData) {
  await requireWarehouseManager();
  const sourceWarehouseId = parseOdooRecordId(value(formData, "sourceWarehouseId"));
  const destWarehouseId = parseOdooRecordId(value(formData, "destWarehouseId"));
  const note = value(formData, "note") || undefined;
  const productIds = formData.getAll("productId").map((v) => String(v).trim());
  const quantities = formData.getAll("lineQuantity").map((v) => String(v).trim());
  const lines: Array<{ productId: number; quantity: number }> = [];
  for (let i = 0; i < productIds.length; i += 1) {
    const productId = parseOdooRecordId(productIds[i]);
    const quantity = Number(quantities[i]);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) continue;
    lines.push({ productId, quantity });
  }
  if (!sourceWarehouseId || !destWarehouseId) {
    redirectFormError("/account/warehouse/transfers/new", {
      code: "warehouse",
      fields: ["sourceWarehouseId", "destWarehouseId"],
    });
  }
  if (!lines.length) {
    redirectFormError("/account/warehouse/transfers/new", {
      code: "lines",
      fields: ["lines", "productId", "lineQuantity"],
    });
  }
  try {
    const transfer = await createWarehouseTransfer({
      sourceWarehouseId,
      destWarehouseId,
      note,
      lines,
    });
    revalidatePath("/account/warehouse");
    revalidatePath("/account/warehouse/transfers");
    redirect(`/account/warehouse/transfers/${transfer.id}?created=1`);
  } catch (error) {
    mapWhError(error, "/account/warehouse/transfers/new");
  }
}

export async function dispatchWarehouseTransferAction(formData: FormData) {
  await requireWarehouseManager();
  const transferId = parseOdooRecordId(value(formData, "transferId"));
  const fallback = transferId
    ? `/account/warehouse/transfers/${transferId}`
    : "/account/warehouse/transfers";
  if (!transferId) redirectFormError(fallback, { code: "notfound" });
  const lines = parseTransferQtyLines(formData);
  try {
    await dispatchWarehouseTransfer(transferId, lines.length ? lines : undefined);
  } catch (error) {
    mapWhError(error, fallback);
  }
  revalidatePath("/account/warehouse");
  revalidatePath("/account/warehouse/transfers");
  revalidatePath(fallback);
  redirect(`${fallback}?dispatched=1`);
}

export async function receiveWarehouseTransferAction(formData: FormData) {
  await requireWarehouseManager();
  const transferId = parseOdooRecordId(value(formData, "transferId"));
  const fallback = transferId
    ? `/account/warehouse/transfers/${transferId}`
    : "/account/warehouse/transfers";
  if (!transferId) redirectFormError(fallback, { code: "notfound" });
  const lines = parseTransferQtyLines(formData);
  if (!lines.length) {
    redirectFormError(fallback, { code: "qty", fields: ["quantity"] });
  }
  try {
    await receiveWarehouseTransfer(transferId, lines);
  } catch (error) {
    mapWhError(error, fallback);
  }
  revalidatePath("/account/warehouse");
  revalidatePath("/account/warehouse/transfers");
  revalidatePath(fallback);
  redirect(`${fallback}?received=1`);
}

export async function cancelWarehouseTransferAction(formData: FormData) {
  await requireWarehouseManager();
  const transferId = parseOdooRecordId(value(formData, "transferId"));
  const fallback = transferId
    ? `/account/warehouse/transfers/${transferId}`
    : "/account/warehouse/transfers";
  if (!transferId) redirectFormError(fallback, { code: "notfound" });
  try {
    await cancelWarehouseTransfer(transferId);
  } catch (error) {
    mapWhError(error, fallback);
  }
  revalidatePath("/account/warehouse");
  revalidatePath("/account/warehouse/transfers");
  revalidatePath(fallback);
  redirect(`${fallback}?cancelled=1`);
}

export async function importWarehouseInventoryAction(formData: FormData) {
  await requireWarehouseManager();
  const warehouseId = parseOdooRecordId(value(formData, "warehouseId"));
  const sessionTypeRaw = value(formData, "sessionType");
  const sessionType = sessionTypeRaw === "opening" ? "opening" as const : "count" as const;
  const file = formData.get("file");
  if (!warehouseId) {
    redirectFormError("/account/warehouse/inventory/import", {
      code: "warehouse",
      fields: ["warehouseId"],
    });
  }
  if (!(file instanceof File) || file.size <= 0) {
    redirectFormError("/account/warehouse/inventory/import", {
      code: "file",
      fields: ["file"],
    });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileBase64 = buffer.toString("base64");
  try {
    const session = await importWarehouseInventory({
      warehouseId,
      sessionType,
      filename: file.name || "import.csv",
      fileBase64,
    });
    revalidatePath("/account/warehouse");
    revalidatePath("/account/warehouse/inventory");
    redirect(`/account/warehouse/inventory/${session.id}?imported=1`);
  } catch (error) {
    mapWhError(error, "/account/warehouse/inventory/import");
  }
}

export async function approveWarehouseInventoryAction(formData: FormData) {
  await requireWarehouseManager();
  const sessionId = parseOdooRecordId(value(formData, "sessionId"));
  const fallback = sessionId
    ? `/account/warehouse/inventory/${sessionId}`
    : "/account/warehouse/inventory";
  if (!sessionId) redirectFormError(fallback, { code: "notfound" });
  try {
    await approveWarehouseInventory(sessionId);
  } catch (error) {
    mapWhError(error, fallback);
  }
  revalidatePath("/account/warehouse");
  revalidatePath("/account/warehouse/inventory");
  revalidatePath("/account/warehouse/stock");
  revalidatePath(fallback);
  redirect(`${fallback}?approved=1`);
}
