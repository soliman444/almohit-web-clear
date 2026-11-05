import Link from "next/link";

import { CatalogPager } from "../components/storefront/catalog-pager";
import { CinematicHero } from "../components/storefront/cinematic-hero";
import { CategoryMosaic } from "../components/storefront/category-mosaic";
import { FeaturedCollections } from "../components/storefront/featured-collections";
import { OffersSection } from "../components/storefront/promo-system";
import { ProductFinder } from "../components/storefront/product-finder";
import { ProductGrid } from "../components/storefront/product-grid";
import { ProductRail } from "../components/storefront/product-rail";
import { ScrollToId } from "../components/storefront/scroll-to-id";
import { StorefrontShell } from "../components/storefront/shell";
import { WholesaleCta } from "../components/storefront/wholesale-cta";
import { StorefrontUnavailable } from "../components/system/storefront-unavailable";

import { fetchStorefrontCategoryCards } from "../lib/catalog/categories";
import {
  parseCatalogMaxMoq,
  parseCatalogMinMoq,
  parseCatalogPage,
  parseCatalogSort,
  storefrontCatalogHref,
  type FinderQuery,
} from "../lib/catalog/filters";
import { homeCatalogSlices } from "../lib/catalog/home";
import { fetchStorefrontProducts } from "../lib/catalog/products";
import { listOdooBrands } from "../lib/odoo/catalog";
import { safeApiCall } from "../lib/odoo/safe";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<FinderQuery>;
}) {
  const query = await searchParams;
  const term = query.q?.trim();
  const page = parseCatalogPage(query.page);
  const sort = parseCatalogSort(query.sort);
  const catalogActive = Boolean(
    term
    || query.category
    || query.brand
    || query.min_moq
    || query.max_moq
    || query.availability
    || (query.sort && query.sort !== "newest")
    || page > 1,
  );

  const catalog = await safeApiCall(async () => {
    // One product list on the default home path; a second list only when filters change the query.
    const catalogPromise = fetchStorefrontProducts({
      q: term,
      category: query.category,
      brand: query.brand,
      minMoq: parseCatalogMinMoq(query.min_moq),
      maxMoq: parseCatalogMaxMoq(query.max_moq),
      sort,
      page,
    });
    const [catalogListed, categories, brands] = await Promise.all([
      catalogPromise,
      fetchStorefrontCategoryCards(),
      listOdooBrands(),
    ]);
    const homeListed = catalogActive
      ? await fetchStorefrontProducts({ pageSize: 24, sort: "newest" })
      : catalogListed;

    return {
      homeListed,
      catalogListed,
      categories,
      brands,
    };
  });

  if (!catalog.ok) {
    return <StorefrontUnavailable />;
  }

  const {
    homeListed,
    catalogListed,
    categories,
    brands,
  } = catalog.data;

  const products = homeListed.items;
  const productTotal = homeListed.pagination.total;
  const listed = catalogListed;
  const home = homeCatalogSlices(products, categories);

  const homeHero =
    categories.find(
      (category) =>
        category.slug === "basic-fruits" ||
        category.slug === "fresh-produce",
    ) ?? home.roots[0];

  const resultLabel = term
    ? `Results for “${term}”`
    : sort === "name_asc"
      ? "A–Z catalog"
      : sort === "name_desc"
        ? "Z–A catalog"
        : sort === "oldest"
          ? "Oldest first"
          : "Newest arrivals";

  return (
    <StorefrontShell transparentHeader>
      <ScrollToId id="catalog" enabled={catalogActive} />

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
            href="/#catalog"
          >
            Browse all
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

      <section
        className="sf-section sf-home-catalog"
        id="catalog"
      >
        <div className="sf-home-section-head">
          <div>
            <p className="sf-kicker">Products</p>
            <h2 className="sf-section-title">{resultLabel}</h2>
          </div>
          <p className="sf-heading-meta">
            {listed.pagination.total} item{listed.pagination.total === 1 ? "" : "s"}
            {listed.pagination.pages > 1
              ? ` · page ${listed.pagination.page} of ${listed.pagination.pages}`
              : ""}
          </p>
        </div>

        <div className="sf-home-catalog-tools">
          <ProductFinder
            categories={categories}
            brands={brands}
            query={query}
            compact
            action="/"
            hash="#catalog"
          />

          <div className="sf-home-sort-chips" aria-label="Quick sort">
            <Link
              className={sort === "newest" ? "is-active" : undefined}
              href={storefrontCatalogHref("/", query, { sort: "newest", page: undefined }) + "#catalog"}
            >
              Newest
            </Link>
            <Link
              className={sort === "oldest" ? "is-active" : undefined}
              href={storefrontCatalogHref("/", query, { sort: "oldest", page: undefined }) + "#catalog"}
            >
              Oldest
            </Link>
            <Link
              className={sort === "name_asc" ? "is-active" : undefined}
              href={storefrontCatalogHref("/", query, { sort: "name_asc", page: undefined }) + "#catalog"}
            >
              Name A–Z
            </Link>
            <Link
              className={sort === "name_desc" ? "is-active" : undefined}
              href={storefrontCatalogHref("/", query, { sort: "name_desc", page: undefined }) + "#catalog"}
            >
              Name Z–A
            </Link>
            {catalogActive ? (
              <Link
                className="sf-text-link"
                href="/#catalog"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </div>

        <ProductGrid
          products={listed.items}
          variant="catalog"
        />

        <CatalogPager
          pagination={listed.pagination}
          hrefForPage={(nextPage) =>
            `${storefrontCatalogHref("/", query, { page: String(nextPage) })}#catalog`
          }
        />
      </section>

      {!catalogActive ? (
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
      ) : null}

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
