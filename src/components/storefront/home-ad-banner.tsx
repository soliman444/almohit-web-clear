import Link from "next/link";
import type { StorefrontPromo } from "../../lib/content/promos";
import type { StorefrontCategoryCard } from "../../lib/catalog/types";
import { ImageShot } from "./image-shot";
import { EDITORIAL } from "./visuals";

export function HomeAdBanner({
  promo,
  imageCategory,
}: {
  promo: StorefrontPromo;
  imageCategory?: StorefrontCategoryCard | null;
}) {
  const image = imageCategory?.image || EDITORIAL.produce;

  return (
    <section className="sf-ad-window" aria-label="Featured offer">
      <Link href={promo.href} className="sf-ad-window-card">
        <div className="sf-ad-window-media" aria-hidden>
          <ImageShot
            src={image}
            alt=""
            seed={promo.id}
            sizes="(max-width: 900px) 100vw, 52vw"
            preset="category-card"
            categorySlug={imageCategory?.slug}
            fitMode={imageCategory?.imageFraming?.fitMode ?? "COVER"}
            focalX={imageCategory?.imageFraming?.focalX ?? 50}
            focalY={imageCategory?.imageFraming?.focalY ?? 50}
            scale={imageCategory?.imageFraming?.scale ?? 1}
            className="sf-fill"
          />
          <span className="sf-ad-window-shade" />
        </div>

        <div className="sf-ad-window-copy">
          <p className="sf-ad-window-kicker">
            {promo.eyebrow}
            {promo.badge ? <span>· {promo.badge}</span> : null}
          </p>
          <h2>{promo.title}</h2>
          <p className="sf-ad-window-text">{promo.copy}</p>
          <div className="sf-ad-window-actions">
            {promo.discountLabel ? (
              <span className="sf-ad-window-value">{promo.discountLabel}</span>
            ) : null}
            <span className="sf-ad-window-cta">
              View offer
              <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
