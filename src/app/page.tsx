import Link from "next/link";

import { CinematicHero } from "../components/storefront/cinematic-hero";
import { CategoryMosaic } from "../components/storefront/category-mosaic";
import { FeaturedCollections } from "../components/storefront/featured-collections";
import { OffersSection } from "../components/storefront/promo-system";
import { ProductRail } from "../components/storefront/product-rail";
import { StorefrontShell } from "../components/storefront/shell";
import { WholesaleCta } from "../components/storefront/wholesale-cta";
import { StorefrontUnavailable } from "../components/system/storefront-unavailable";

import { fetchStorefrontCategoryCards } from "../lib/catalog/categories";
import { fetchStorefrontProducts } from "../lib/catalog/products";
import { homeCatalogSlices } from "../lib/catalog/home";
import { safeApiCall } from "../lib/odoo/safe";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await safeApiCall(async () => {
    const [listed, categories] = await Promise.all([
      fetchStorefrontProducts(),
      fetchStorefrontCategoryCards(),
    ]);

    return {
      products: listed.items,
      productTotal: listed.pagination.total,
      categories,
    };
  });

  if (!catalog.ok) {
    return <StorefrontUnavailable />;
  }

  const {
    products,
    productTotal,
    categories,
  } = catalog.data;

  const home = homeCatalogSlices(products, categories);

  const homeHero =
    categories.find(
      (category) =>
        category.slug === "basic-fruits" ||
        category.slug === "fresh-produce",
    ) ?? home.roots[0];

  return (
    <StorefrontShell transparentHeader>
      <CinematicHero
        collections={home.collections}
        focalX={homeHero?.heroFocalX}
        focalY={homeHero?.heroFocalY}
        frameScale={homeHero?.heroScale}
      />

      <section
        className="sf-section sf-home-categories"
        id="discover"
      >
        <div className="sf-home-section-head">
          <div>
            <p className="sf-kicker">Catalog</p>
            <h2 className="sf-section-title">
              Shop by category
            </h2>
          </div>

          <p className="sf-heading-meta">
            {productTotal} products · {home.roots.length} collections
          </p>
        </div>

        <div className="sf-brand-options">
          {home.roots.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              className="sf-pill"
              href={`/categories/${category.slug}`}
            >
              {category.name}
            </Link>
          ))}

          <Link
            className="sf-pill"
            href="/products"
          >
            View all
          </Link>
        </div>

        <CategoryMosaic
          categories={home.roots.slice(0, 6)}
          variant="circle"
        />
      </section>

      {home.roots.length > 0 ? (
        <FeaturedCollections
          categories={home.roots.slice(0, 3)}
        />
      ) : null}

      <ProductRail
        products={
          home.bestSellers.length
            ? home.bestSellers.slice(0, 6)
            : products.slice(0, 6)
        }
        index="03"
        eyebrow="Selected"
        title="Ready to supply."
      />

      <OffersSection
        promos={home.promos.slice(0, 3)}
      />

      {home.brands.length > 0 ? (
        <section
          className="sf-section sf-home-brands"
          id="brands"
        >
          <div className="sf-home-section-head">
            <div>
              <p className="sf-kicker">Brands</p>
              <h2 className="sf-section-title">
                Browse suppliers
              </h2>
            </div>

            <Link
              className="sf-text-link"
              href="/products"
            >
              View catalog
            </Link>
          </div>

          <div className="sf-brand-options">
            {home.brands.slice(0, 8).map((brand) => (
              <Link
                key={brand.slug}
                className="sf-pill"
                href={`/products?brand=${brand.slug}`}
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <WholesaleCta />
    </StorefrontShell>
  );
}