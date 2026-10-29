"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseOdooRecordId } from "../odoo/catalog";
import { decodeUploadImage } from "../odoo/images";
import {
  confirmBuyerPurchase,
  createBuyerProduct,
  createBuyerPurchase,
  createBuyerSupplier,
  receiveBuyerReceipt,
  updateBuyerSupplier,
} from "../odoo/buyer";
import { mapApiClientFormError, redirectFormError } from "../form-errors";
import { requireBuyer } from "../session/access";

function value(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function zodFields(error: z.ZodError) {
  return [...new Set(error.issues.map((issue) => String(issue.path[0] ?? "invalid")))];
}

function mapBuyerError(error: unknown, fallbackPath: string): never {
  mapApiClientFormError(error, {
    fallbackPath,
    fallbackCode: "failed",
    known: {
      SUPPLIER_NOT_FOUND: { code: "notfound", path: "/account/buyer/suppliers", fields: ["supplierId"] },
      BUYER_PRODUCT_NOT_FOUND: { code: "notfound", path: "/account/buyer/products", fields: ["lines"] },
      PURCHASE_NOT_FOUND: { code: "notfound", path: "/account/buyer/purchases" },
      RECEIPT_NOT_FOUND: { code: "notfound", path: "/account/buyer/receipts" },
      NAME_REQUIRED: { code: "name", fields: ["name"] },
      PURCHASE_NOT_EDITABLE: { code: "editable" },
      CURRENCY_NOT_FOUND: { code: "currency", fields: ["currencyId"] },
      INVALID_FIELDS: { code: "invalid" },
      INVALID_IMAGE: { code: "image", fields: ["images", "image"] },
      INVALID_IMAGE_TYPE: { code: "image", fields: ["images", "image"] },
      IMAGE_TOO_LARGE: { code: "image", fields: ["images", "image"] },
      INVALID_RECEIPT_QUANTITY: { code: "qty", fields: ["quantityDone"] },
      RECEIPT_NOT_READY: { code: "failed", fields: ["quantityDone"] },
      PURCHASE_CONFIRM_FAILED: { code: "failed" },
    },
  });
}

const supplierSchema = z.object({
  name: z.string().min(2).max(160),
  phone: z.string().max(40).optional(),
  mobile: z.string().max(40).optional(),
  email: z.string().email().optional().or(z.literal("")),
  street: z.string().max(200).optional(),
  street2: z.string().max(200).optional(),
  city: z.string().max(120).optional(),
  zip: z.string().max(40).optional(),
  taxNumber: z.string().max(80).optional(),
  notes: z.string().max(1000).optional(),
});

function parseSupplierForm(formData: FormData) {
  return supplierSchema.safeParse({
    name: value(formData, "name"),
    phone: value(formData, "phone") || undefined,
    mobile: value(formData, "mobile") || undefined,
    email: value(formData, "email") || undefined,
    street: value(formData, "street") || undefined,
    street2: value(formData, "street2") || undefined,
    city: value(formData, "city") || undefined,
    zip: value(formData, "zip") || undefined,
    taxNumber: value(formData, "taxNumber") || undefined,
    notes: value(formData, "notes") || undefined,
  });
}

export async function createBuyerSupplierAction(formData: FormData) {
  await requireBuyer();
  const parsed = parseSupplierForm(formData);
  if (!parsed.success) {
    redirectFormError("/account/buyer/suppliers/new", {
      code: "invalid",
      fields: zodFields(parsed.error),
    });
  }
  const data = parsed.data;

  try {
    const supplier = await createBuyerSupplier({
      name: data.name,
      phone: data.phone,
      mobile: data.mobile,
      email: data.email || undefined,
      street: data.street,
      street2: data.street2,
      city: data.city,
      zip: data.zip,
      taxNumber: data.taxNumber,
      notes: data.notes,
    });
    revalidatePath("/account/buyer/suppliers");
    redirect(`/account/buyer/suppliers/${supplier.id}?created=1`);
  } catch (error) {
    mapBuyerError(error, "/account/buyer/suppliers/new");
  }
}

export async function updateBuyerSupplierAction(formData: FormData) {
  await requireBuyer();
  const supplierId = parseOdooRecordId(value(formData, "id"));
  if (!supplierId) {
    redirectFormError("/account/buyer/suppliers", { code: "notfound" });
  }
  const parsed = parseSupplierForm(formData);
  if (!parsed.success) {
    redirectFormError(`/account/buyer/suppliers/${supplierId}`, {
      code: "invalid",
      fields: zodFields(parsed.error),
    });
  }
  const data = parsed.data;

  try {
    await updateBuyerSupplier(supplierId, {
      name: data.name,
      phone: data.phone,
      mobile: data.mobile,
      email: data.email || undefined,
      street: data.street,
      street2: data.street2,
      city: data.city,
      zip: data.zip,
      taxNumber: data.taxNumber,
      notes: data.notes,
    });
    revalidatePath("/account/buyer/suppliers");
    revalidatePath(`/account/buyer/suppliers/${supplierId}`);
    redirect(`/account/buyer/suppliers/${supplierId}?updated=1`);
  } catch (error) {
    mapBuyerError(error, `/account/buyer/suppliers/${supplierId}`);
  }
}

export async function createBuyerProductAction(formData: FormData) {
  await requireBuyer();
  const parsed = z.object({
    name: z.string().min(2).max(160),
    defaultCode: z.string().max(64).optional(),
    barcode: z.string().max(64).optional(),
    type: z.enum(["consu", "service", "product"]).optional(),
    purchaseDescription: z.string().max(1000).optional(),
    uomId: z.number().int().positive().optional(),
  }).safeParse({
    name: value(formData, "name"),
    defaultCode: value(formData, "defaultCode") || undefined,
    barcode: value(formData, "barcode") || undefined,
    type: value(formData, "type") || undefined,
    purchaseDescription: value(formData, "purchaseDescription") || undefined,
    uomId: value(formData, "uomId") ? Number(value(formData, "uomId")) : undefined,
  });
  if (!parsed.success) {
    redirectFormError("/account/buyer/products/new", {
      code: "invalid",
      fields: zodFields(parsed.error),
    });
  }
  const data = parsed.data;

  try {
    const image = formData.get("image");
    const decoded = await decodeUploadImage(image instanceof File ? image : null);
    const product = await createBuyerProduct({
      name: data.name,
      defaultCode: data.defaultCode,
      barcode: data.barcode,
      type: data.type,
      purchaseDescription: data.purchaseDescription,
      uomId: data.uomId,
      imageBase64: decoded.imageBase64,
      imageContentType: decoded.imageContentType,
    });
    revalidatePath("/account/buyer/products");
    redirect(`/account/buyer/products/${product.id}?created=1`);
  } catch (error) {
    mapBuyerError(error, "/account/buyer/products/new");
  }
}

export async function createBuyerPurchaseAction(formData: FormData) {
  await requireBuyer();
  const supplierId = parseOdooRecordId(value(formData, "supplierId"));
  if (!supplierId) {
    redirectFormError("/account/buyer/purchases/new", {
      code: "supplier",
      fields: ["supplierId"],
    });
  }
  const currencyId = parseOdooRecordId(value(formData, "currencyId"));
  if (!currencyId) {
    redirectFormError("/account/buyer/purchases/new", {
      code: "currency",
      fields: ["currencyId"],
    });
  }

  const productIds = formData.getAll("productId").map((entry) => String(entry).trim());
  const quantities = formData.getAll("quantity").map((entry) => String(entry).trim());
  const prices = formData.getAll("priceUnit").map((entry) => String(entry).trim());
  const plannedDates = formData.getAll("plannedDate").map((entry) => String(entry).trim());
  const lines = productIds.flatMap((productId, index) => {
    const id = Number(productId);
    const quantity = Number(quantities[index]);
    const priceUnit = Number(prices[index]);
    const plannedDate = plannedDates[index] || undefined;
    if (!Number.isFinite(id) || id < 1) return [];
    if (!Number.isFinite(quantity) || quantity <= 0) return [];
    if (!Number.isFinite(priceUnit) || priceUnit < 0) return [];
    return [{
      productId: id,
      quantity,
      priceUnit,
      ...(plannedDate ? { plannedDate } : {}),
    }];
  });

  if (lines.length === 0) {
    redirectFormError("/account/buyer/purchases/new", {
      code: "lines",
      fields: ["lines", "productId", "quantity", "priceUnit"],
    });
  }

  try {
    const images: Array<{ name?: string; imageBase64: string; imageContentType: string }> = [];
    const files = formData.getAll("images");
    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue;
      const decoded = await decodeUploadImage(file);
      if (!decoded.imageBase64 || !decoded.imageContentType) continue;
      images.push({
        name: file.name || undefined,
        imageBase64: decoded.imageBase64,
        imageContentType: decoded.imageContentType,
      });
    }

    const purchase = await createBuyerPurchase({
      supplierId,
      currencyId,
      dateOrder: value(formData, "dateOrder") || undefined,
      notes: value(formData, "notes") || undefined,
      lines,
      images: images.length > 0 ? images.slice(0, 12) : undefined,
    });
    revalidatePath("/account/buyer/purchases");
    redirect(`/account/buyer/purchases/${purchase.id}?created=1`);
  } catch (error) {
    mapBuyerError(error, "/account/buyer/purchases/new");
  }
}

export async function confirmBuyerPurchaseAction(formData: FormData) {
  await requireBuyer();
  const purchaseId = parseOdooRecordId(value(formData, "purchaseId"));
  if (!purchaseId) {
    redirectFormError("/account/buyer/purchases", { code: "notfound" });
  }

  try {
    await confirmBuyerPurchase(purchaseId);
    revalidatePath("/account/buyer/purchases");
    revalidatePath(`/account/buyer/purchases/${purchaseId}`);
    revalidatePath("/account/buyer/receipts");
    redirect(`/account/buyer/purchases/${purchaseId}?confirmed=1`);
  } catch (error) {
    mapBuyerError(error, `/account/buyer/purchases/${purchaseId}`);
  }
}

export async function receiveBuyerReceiptAction(formData: FormData) {
  await requireBuyer();
  const pickingId = parseOdooRecordId(value(formData, "pickingId"));
  if (!pickingId) {
    redirectFormError("/account/buyer/receipts", { code: "notfound" });
  }

  const moveIds = formData.getAll("moveId").map((entry) => String(entry).trim());
  const quantities = formData.getAll("quantityDone").map((entry) => String(entry).trim());
  const lines = moveIds.flatMap((moveId, index) => {
    const id = Number(moveId);
    const quantityDone = Number(quantities[index]);
    if (!Number.isFinite(id) || id < 1) return [];
    if (!Number.isFinite(quantityDone) || quantityDone < 0) return [];
    return [{ moveId: id, quantityDone }];
  });

  if (lines.length === 0) {
    redirectFormError(`/account/buyer/receipts/${pickingId}`, {
      code: "qty",
      fields: ["quantityDone"],
    });
  }

  try {
    await receiveBuyerReceipt(pickingId, lines);
    revalidatePath("/account/buyer/receipts");
    revalidatePath(`/account/buyer/receipts/${pickingId}`);
    revalidatePath("/account/buyer/purchases");
    redirect(`/account/buyer/receipts/${pickingId}?received=1`);
  } catch (error) {
    mapBuyerError(error, `/account/buyer/receipts/${pickingId}`);
  }
}
