import type { StorefrontProduct } from "./types";
import {
  getOdooProduct,
  listOdooProducts,
  parseOdooRecordId,
  type OdooProductListParams,
  type StorefrontProductList,
} from "../odoo/catalog";
import { getDisplayCurrency, resetDisplayCurrencyToCompany } from "../currency/display";
import { ApiClientError } from "../odoo/errors";

async function withCurrencyFallback<T>(
  currency: string | undefined,
  run: (code: string | undefined) => Promise<T>,
): Promise<T> {
  try {
    return await run(currency);
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.code !== "INVALID_CURRENCY" || !currency) {
      throw error;
    }
    // Selected display currency is in the FX catalog but not authorized for this merchant.
    await resetDisplayCurrencyToCompany().catch(() => undefined);
    return run(undefined);
  }
}

export async function fetchStorefrontProducts(
  query: OdooProductListParams & {
    category?: string;
    brand?: string;
  } = {},
): Promise<StorefrontProductList> {
  const currency = query.currency || (await getDisplayCurrency());
  return withCurrencyFallback(currency || undefined, (code) =>
    listOdooProducts({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      categoryId: query.categoryId ?? parseOdooRecordId(query.category) ?? undefined,
      includeChildren: query.includeChildren,
      brandId: query.brandId ?? parseOdooRecordId(query.brand) ?? undefined,
      inStock: query.inStock,
      minMoq: query.minMoq,
      maxMoq: query.maxMoq,
      sort: query.sort,
      currency: code,
    }),
  );
}

export async function fetchStorefrontProduct(
  slug: string,
  currencyCode?: string | null,
): Promise<StorefrontProduct | null> {
  const id = parseOdooRecordId(slug);
  if (id == null) return null;
  // `null` skips currency lookup so the product HTTP call can start immediately.
  if (currencyCode === null) {
    return getOdooProduct(id, undefined, undefined);
  }
  const currency = currencyCode || (await getDisplayCurrency());
  return withCurrencyFallback(currency || undefined, (code) =>
    getOdooProduct(id, undefined, code),
  );
}

/** Related items from an already-loaded product — does not re-fetch the product. */
export async function fetchRelatedForProduct(
  product: StorefrontProduct,
  options: { limit?: number; currency?: string; pageSize?: number } = {},
): Promise<StorefrontProduct[]> {
  const categoryId = parseOdooRecordId(product.category.id);
  if (!categoryId) return [];
  const currency = options.currency || (await getDisplayCurrency());
  const limit = options.limit ?? 4;
  const listed = await withCurrencyFallback(currency || undefined, (code) =>
    listOdooProducts({
      categoryId,
      pageSize: options.pageSize ?? Math.max(limit + 1, 8),
      sort: "newest",
      currency: code,
    }),
  );
  return listed.items.filter((item) => item.id !== product.id).slice(0, limit);
}

export async function fetchRelatedProducts(slug: string): Promise<StorefrontProduct[]> {
  const product = await fetchStorefrontProduct(slug);
  if (!product) return [];
  return fetchRelatedForProduct(product);
}
