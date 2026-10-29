import type { StorefrontProduct } from "./types";
import {
  getOdooProduct,
  listOdooProducts,
  parseOdooRecordId,
  type OdooProductListParams,
  type StorefrontProductList,
} from "../odoo/catalog";
import { getDisplayCurrency } from "../currency/display";

export async function fetchStorefrontProducts(
  query: OdooProductListParams & {
    category?: string;
    brand?: string;
  } = {},
): Promise<StorefrontProductList> {
  const currency = query.currency || (await getDisplayCurrency());
  return listOdooProducts({
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
    currency: currency || undefined,
  });
}

export async function fetchStorefrontProduct(slug: string): Promise<StorefrontProduct | null> {
  const id = parseOdooRecordId(slug);
  if (id == null) return null;
  const currency = await getDisplayCurrency();
  return getOdooProduct(id, undefined, currency || undefined);
}

export async function fetchRelatedProducts(slug: string): Promise<StorefrontProduct[]> {
  const id = parseOdooRecordId(slug);
  if (id == null) return [];
  const currency = await getDisplayCurrency();
  const current = await getOdooProduct(id, undefined, currency || undefined);
  if (!current) return [];
  const categoryId = parseOdooRecordId(current.category.id);
  const listed = await listOdooProducts({
    ...(categoryId ? { categoryId } : {}),
    currency: currency || undefined,
  });
  return listed.items.filter((product) => product.id !== current.id).slice(0, 4);
}
