import Link from "next/link";
import type { StorefrontCategoryCard } from "../../lib/catalog/types";
import { ImageShot } from "./image-shot";
import { EDITORIAL } from "./visuals";

export function FeaturedCollections({
  categories,
}: {
  categories: StorefrontCategoryCard[];
}) {
  const rows = categories.slice(0, 3);

  if (!rows.length) return null;

  const [lead, ...rest] = rows;

  return (
    <section className="sf-section is-collections" id="collections">
      <div className="sf-collections-head">
        <div>
          <p className="sf-kicker">Collections</p>
          <h2 className="sf-section-title">Featured collections</h2>
        </div>

        <Link className="sf-text-link" href="/products">
          View all
        </Link>
      </div>

      <div className="sf-collections-stage">
        <Link
          href={`/categories/${lead.slug}`}
          className="sf-collection-panel is-lead"
          style={{ ["--sf-collection-delay" as string]: "0ms" }}
        >
          <div className="sf-collection-media">
            <ImageShot
              src={lead.image || EDITORIAL.citrus}
              alt={lead.name}
              seed={lead.slug}
              sizes="(max-width: 900px) 100vw, 62vw"
              preset="category-card"
              categorySlug={lead.slug}
              fitMode={lead.imageFraming?.fitMode}
              focalX={lead.imageFraming?.focalX}
              focalY={lead.imageFraming?.focalY}
              scale={lead.imageFraming?.scale}
              className="sf-fill"
            />
          </div>

          <div className="sf-collection-caption">
            <div className="sf-collection-copy">
              <h3>{lead.name}</h3>
              <p>
                {lead.description || "Explore this wholesale collection."}
              </p>
            </div>
            <span className="sf-collection-link">
              Explore
              <span aria-hidden>→</span>
            </span>
          </div>
        </Link>

        {rest.length > 0 ? (
          <div className="sf-collections-stack">
            {rest.map((category, index) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="sf-collection-panel"
                style={{
                  ["--sf-collection-delay" as string]: `${(index + 1) * 90}ms`,
                }}
              >
                <div className="sf-collection-media">
                  <ImageShot
                    src={category.image || EDITORIAL.citrus}
                    alt={category.name}
                    seed={category.slug}
                    sizes="(max-width: 900px) 100vw, 38vw"
                    preset="category-card"
                    categorySlug={category.slug}
                    fitMode={category.imageFraming?.fitMode}
                    focalX={category.imageFraming?.focalX}
                    focalY={category.imageFraming?.focalY}
                    scale={category.imageFraming?.scale}
                    className="sf-fill"
                  />
                </div>

                <div className="sf-collection-caption">
                  <div className="sf-collection-copy">
                    <h3>{category.name}</h3>
                    <p>
                      {category.description ||
                        "Explore this wholesale collection."}
                    </p>
                  </div>
                  <span className="sf-collection-link">
                    Explore
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
