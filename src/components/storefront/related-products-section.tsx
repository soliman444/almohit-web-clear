import { fetchRelatedForProduct } from "../../lib/catalog/products";
import type { StorefrontProduct } from "../../lib/catalog/types";
import { ProductRelated } from "./product-related";

/** Async island: loads after the PDP critical path so related catalog I/O does not block first paint. */
export async function RelatedProductsSection({
  product,
  currency,
}: {
  product: StorefrontProduct;
  currency?: string;
}) {
  const related = await fetchRelatedForProduct(product, {
    limit: 4,
    currency,
  });
  return <ProductRelated products={related} />;
}
