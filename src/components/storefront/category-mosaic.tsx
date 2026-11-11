import Link from "next/link";
import type { StorefrontCategoryCard } from "../../lib/catalog/types";
import { ImageShot } from "./image-shot";
import { EDITORIAL } from "./visuals";

export function CategoryMosaic({
  categories,
  limit = 6,
  variant = "square",
}: {
  categories: StorefrontCategoryCard[];
  limit?: number;
  variant?: "circle" | "square";
}) {
  const rows = categories.slice(0, limit);
  if (!rows.length) return null;

  return (
    <div className={`sf-cat-mosaic is-${variant}`}>
      {rows.map((category) => (
        <Link
          key={category.id}
          className="sf-cat-card"
          href={`/categories/${category.slug}`}
        >
          <div className="sf-cat-card-media">
            <ImageShot
              src={category.image || EDITORIAL.oil}
              alt={category.name}
              seed={category.slug}
              sizes={
                variant === "circle"
                  ? "(max-width: 700px) 34vw, (max-width: 1100px) 18vw, 160px"
                  : "(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 420px"
              }
              preset="category-card"
              categorySlug={category.slug}
              fit="cover"
              fitMode="COVER"
              focalX={category.imageFraming?.focalX ?? 50}
              focalY={category.imageFraming?.focalY ?? 50}
              scale={1}
              className="sf-fill"
            />
          </div>
          <div className="sf-cat-card-meta">
            <h3>{category.name}</h3>
            <p>{category.productCount ? `${category.productCount} products` : "Collection"}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
