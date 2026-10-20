import Link from "next/link";
import type { StorefrontCategoryCard } from "../../lib/catalog/types";
import { ImageShot } from "./image-shot";
import { SectionHeading } from "./section-heading";
import { EDITORIAL } from "./visuals";

export function FeaturedCollections({
  categories,
}: {
  categories: StorefrontCategoryCard[];
}) {
  const rows = categories.slice(0, 3);

  if (!rows.length) return null;

  return (
    <section className="sf-section is-collections" id="collections">
      <div className="sf-collections-head">
        <SectionHeading title="Featured collections" />

        <Link className="sf-text-link" href="/products">
          View all
        </Link>
      </div>

      <div className="sf-collections-grid">
        {rows.map((category, index) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="sf-collection-card"
          >
            <div className="sf-collection-media">
              <ImageShot
                src={category.image || EDITORIAL.citrus}
                alt={category.name}
                seed={category.slug}
                sizes="(max-width: 700px) 100vw, 33vw"
                preset="category-card"
                categorySlug={category.slug}
                fitMode={category.imageFraming?.fitMode}
                focalX={category.imageFraming?.focalX}
                focalY={category.imageFraming?.focalY}
                scale={category.imageFraming?.scale}
                className="sf-fill"
              />

              <div className="sf-collection-shade" />

              <div className="sf-collection-content">
                <span className="sf-collection-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <h3>{category.name}</h3>

                  <p>
                    {category.description ||
                      "Explore this wholesale collection."}
                  </p>

                  <span className="sf-collection-link">
                    Explore collection
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}