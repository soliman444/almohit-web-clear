import Link from "next/link";
import type { FinderQuery } from "../../lib/catalog/filters";
import { storefrontCatalogHref } from "../../lib/catalog/filters";
import type { StorefrontProduct } from "../../lib/catalog/types";
import { ProductCard } from "./product-card";
import { Reveal } from "./reveal";

const SORT_CHIPS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
] as const;

export function ProductRail({
  products,
  index = "02",
  eyebrow = "Product campaign",
  title = "From the catalog.",
  sort = "newest",
  query = {},
  showSort = true,
  sectionId = "arrivals",
}: {
  products: StorefrontProduct[];
  index?: string;
  eyebrow?: string;
  title?: string;
  sort?: string;
  query?: FinderQuery;
  showSort?: boolean;
  sectionId?: string;
}) {
  if (!products.length) return null;

  return (
    <section className="sf-section is-browse" id={sectionId}>
      <Reveal>
        <div className="sf-heading">
          <div className="sf-heading-meta">
            <span>{index}</span>
            <span>{eyebrow}</span>
          </div>
          <h2>{title}</h2>
          {showSort ? (
            <div className="sf-home-sort-chips is-rail" aria-label="Quick sort">
              {SORT_CHIPS.map((chip) => (
                <Link
                  key={chip.value}
                  className={sort === chip.value ? "is-active" : undefined}
                  href={
                    storefrontCatalogHref("/", query, {
                      sort: chip.value,
                      page: undefined,
                    }) + `#${sectionId}`
                  }
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </Reveal>
      <div className="sf-rail">
        {products.slice(0, 6).map((product, itemIndex) => (
          <ProductCard key={product.id} product={product} index={itemIndex} />
        ))}
      </div>
    </section>
  );
}
