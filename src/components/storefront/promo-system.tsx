import Link from "next/link";

import {
  STOREFRONT_PROMOS,
  type StorefrontPromo,
} from "../../lib/content/promos";
import { SHOT } from "../../lib/content/shots";
import type { StorefrontCategoryCard } from "../../lib/catalog/types";
import { ImageShot } from "./image-shot";

const OFFER_BACKDROPS = [
  SHOT.citrusMacro,
  SHOT.mango,
  SHOT.dates,
  SHOT.avocado,
  SHOT.pomegranate,
  SHOT.grapes,
] as const;

function offerBackdrop(promo: StorefrontPromo, index: number) {
  if (promo.id.includes("citrus") || promo.categorySlug?.includes("citrus")) {
    return SHOT.citrusMacro;
  }
  if (
    promo.id.includes("desert")
    || promo.id.includes("date")
    || promo.categorySlug?.includes("desert")
    || promo.productSlug?.includes("date")
  ) {
    return SHOT.pineapple;
  }
  if (promo.id.includes("season")) return SHOT.avocado;
  return OFFER_BACKDROPS[(index - 1 + OFFER_BACKDROPS.length) % OFFER_BACKDROPS.length];
}

export function OfferBadge({ label }: { label: string }) {
  return (
    <span className="sf-market-badge">
      <span className="sf-market-dot" />
      {label}
    </span>
  );
}

function OfferAdCard({
  promo,
  index,
  image,
  imageCategory,
}: {
  promo: StorefrontPromo;
  index: number;
  image: string;
  imageCategory?: StorefrontCategoryCard | null;
}) {
  return (
    <Link href={promo.href} className="sf-ad-window-card is-offer">
      <div className="sf-ad-window-media" aria-hidden>
        <ImageShot
          src={image}
          alt=""
          seed={`${promo.id}-backdrop-${index}`}
          sizes="(max-width: 900px) 100vw, 52vw"
          preset="category-card"
          categorySlug={imageCategory?.slug}
          fit="cover"
          fitMode="COVER"
          focalX={50}
          focalY={50}
          scale={1}
          className="sf-fill"
        />
        <span className="sf-ad-window-shade" />
      </div>

      <div className="sf-ad-window-copy">
        <p className="sf-ad-window-kicker">
          {String(index).padStart(2, "0")} · {promo.eyebrow}
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
  );
}

export function DealBanner({
  promo,
  imageCategory,
}: {
  promo: StorefrontPromo;
  imageCategory?: StorefrontCategoryCard | null;
}) {
  return (
    <div className="sf-ad-window is-inline">
      <OfferAdCard
        promo={promo}
        index={1}
        image={imageCategory?.image || offerBackdrop(promo, 1)}
        imageCategory={imageCategory}
      />
    </div>
  );
}

export function OffersSection({
  promos = STOREFRONT_PROMOS,
  categories = [],
}: {
  promos?: StorefrontPromo[];
  categories?: StorefrontCategoryCard[];
}) {
  const rows = promos.slice(0, 3);

  if (!rows.length) return null;

  return (
    <section className="sf-market-section is-ad" id="offers">
      <header className="sf-market-header is-ad">
        <p className="sf-market-label">MARKET / 03</p>
        <h2>Current opportunities</h2>
        <p className="sf-market-header-note">
          Wholesale desk · {String(rows.length).padStart(2, "0")} active
        </p>
      </header>

      <div className="sf-market-ads">
        {rows.map((promo, index) => {
          const matchedCategory = categories.find(
            (category) => category.slug === promo.categorySlug,
          );
          // Always use a distinct editorial backdrop per card so offers never share one photo.
          const image = offerBackdrop(promo, index + 1);

          return (
            <div className="sf-ad-window is-market" key={promo.id}>
              <OfferAdCard
                promo={promo}
                index={index + 1}
                image={image}
                imageCategory={matchedCategory ?? null}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PromoSlot({
  promo,
}: {
  promo?: StorefrontPromo;
}) {
  if (!promo) return null;

  return (
    <div className="sf-promo-slot">
      <DealBanner promo={promo} />
    </div>
  );
}
