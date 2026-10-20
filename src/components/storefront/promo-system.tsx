import Link from "next/link";

import {
  STOREFRONT_PROMOS,
  type StorefrontPromo,
} from "../../lib/content/promos";

export function OfferBadge({ label }: { label: string }) {
  return (
    <span className="sf-market-badge">
      <span className="sf-market-dot" />
      {label}
    </span>
  );
}

export function DealBanner({ promo }: { promo: StorefrontPromo }) {
  return (
    <Link href={promo.href} className="sf-market-lead">
      <div className="sf-market-lead-code">
        <span>01</span>
        <small>LIVE</small>
      </div>

      <div className="sf-market-lead-main">
        <p className="sf-market-overline">{promo.eyebrow}</p>

        <h3>{promo.title}</h3>

        <p className="sf-market-copy">
          {promo.copy}
        </p>
      </div>

      <div className="sf-market-lead-side">
        {promo.badge ? (
          <OfferBadge label={promo.badge} />
        ) : null}

        {promo.discountLabel ? (
          <strong className="sf-market-value">
            {promo.discountLabel}
          </strong>
        ) : null}

        <span className="sf-market-open">
          Open
          <span aria-hidden>↗</span>
        </span>
      </div>
    </Link>
  );
}

export function OffersSection({
  promos = STOREFRONT_PROMOS,
}: {
  promos?: StorefrontPromo[];
}) {
  const [lead, ...rest] = promos.slice(0, 4);

  if (!lead) return null;

  return (
    <section className="sf-market-section" id="offers">
      <header className="sf-market-header">
        <div>
          <p className="sf-market-label">
            MARKET / 03
          </p>

          <h2>Current opportunities</h2>
        </div>

        <div className="sf-market-header-meta">
          <span>Wholesale desk</span>
          <span>{String(promos.length).padStart(2, "0")} active</span>
        </div>
      </header>

      <DealBanner promo={lead} />

      {rest.length > 0 ? (
        <div className="sf-market-list">
          {rest.map((promo, index) => (
            <Link
              key={promo.id}
              href={promo.href}
              className="sf-market-row"
            >
              <span className="sf-market-row-number">
                {String(index + 2).padStart(2, "0")}
              </span>

              <div className="sf-market-row-title">
                <small>{promo.eyebrow}</small>
                <h3>{promo.title}</h3>
              </div>

              <p className="sf-market-row-copy">
                {promo.copy}
              </p>

              <div className="sf-market-row-status">
                {promo.discountLabel ? (
                  <strong>{promo.discountLabel}</strong>
                ) : promo.badge ? (
                  <OfferBadge label={promo.badge} />
                ) : (
                  <span>Available</span>
                )}
              </div>

              <span className="sf-market-row-arrow" aria-hidden>
                ↗
              </span>
            </Link>
          ))}
        </div>
      ) : null}
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