import type { CategoryDetail } from "@/types/contracts";
import type { StorefrontCategoryCard } from "./types";
import {
  applyFirstProductCategoryImages,
  listAllOdooCategories,
  listOdooProducts,
  parseOdooRecordId,
} from "../odoo/catalog";

/** In-stock saleable categories for mosaics / finder, with product imagery. */
export async function fetchStorefrontCategoryCards(): Promise<StorefrontCategoryCard[]> {
  const [categories, listed] = await Promise.all([
    listAllOdooCategories({ inStock: true }),
    // listOdooProducts recovers from INVALID_CURRENCY (strip currency → public catalog).
    listOdooProducts({ inStock: true, pageSize: 100 }),
  ]);
  return applyFirstProductCategoryImages(categories, listed.items);
}

export async function fetchStorefrontCategory(slug: string): Promise<CategoryDetail | null> {
  const id = parseOdooRecordId(slug);
  if (id == null) return null;

  const categories = await fetchStorefrontCategoryCards();
  const category = categories.find((item) => item.id === String(id));
  if (!category) return null;

  return {
    id: category.id,
    parentId: category.parentId,
    name: category.name,
    slug: category.slug,
    description: category.description,
    heroVideoUrl: null,
    heroPosterUrl: category.image,
  };
}
