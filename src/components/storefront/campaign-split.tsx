import Link from "next/link";
import { primaryImage, secondaryImage } from "../../lib/catalog/media";
import type { StorefrontProduct } from "../../lib/catalog/types";
import { ImageShot } from "./image-shot";

export function CampaignSplit({
  product,
}: {
  product: StorefrontProduct | null;
}) {
  if (!product) return null;

  const image = secondaryImage(product) || primaryImage(product);

  return (
    <section className="sf-editorial-product">
      <div className="sf-editorial-product-inner">
        <div className="sf-editorial-product-copy">
          <div>
            <p className="sf-editorial-eyebrow">
              Selected product
            </p>

            <h2>{product.name}</h2>

            <p className="sf-editorial-description">
              {product.shortDescription ||
                "Selected from our wholesale catalog and ready to explore."}
            </p>
          </div>

          <div className="sf-editorial-product-footer">
            <div className="sf-editorial-meta">
              <span>{product.category.name}</span>

              {product.brand?.name ? (
                <span>{product.brand.name}</span>
              ) : null}
            </div>

            <Link
              href={`/products/${product.slug}`}
              className="sf-editorial-product-link"
            >
              <span>View product</span>
              <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="sf-editorial-product-visual"
          aria-label={`View ${product.name}`}
        >
          <div className="sf-editorial-product-image">
            {image ? (
              <ImageShot
                src={image.src}
                alt={image.alt || product.name}
                seed={product.slug}
                sizes="(max-width: 800px) 90vw, 46vw"
                preset="product-detail"
                categorySlug={product.category.slug}
                fit="contain"
                focalX={image.focalX}
                focalY={image.focalY}
                scale={1}
                className="sf-editorial-product-shot"
              />
            ) : (
              <div className="sf-editorial-product-placeholder">
                <span>{product.name}</span>
              </div>
            )}
          </div>

          <span className="sf-editorial-view">
            View details
            <span aria-hidden>→</span>
          </span>
        </Link>
      </div>
    </section>
  );
}