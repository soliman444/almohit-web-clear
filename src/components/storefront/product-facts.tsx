import type { StorefrontProduct } from "../../lib/catalog/types";

export function ProductFacts({ product }: { product: StorefrontProduct }) {
  const facts = [
    ["Collection", product.category.name],
    ["Brand", product.brand?.name ?? "Almohit"],
    ["SKU", product.sku],
    ["Minimum order", String(product.minOrderQuantity)],
  ] as const;

  return (
    <section className="sf-pdp-facts is-cards" aria-label="Key product facts">
      {facts.map(([label, value]) => (
        <div className="sf-pdp-fact" key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </section>
  );
}
