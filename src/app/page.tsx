import Link from "next/link";
import { redirect } from "next/navigation";

import { CatalogPager } from "../components/storefront/catalog-pager";
import { CinematicHero } from "../components/storefront/cinematic-hero";
import { CategoryMosaic } from "../components/storefront/category-mosaic";
import { HomeAdBanner } from "../components/storefront/home-ad-banner";
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
import { hasOdooSession } from "../lib/odoo/auth";
import { listOdooBrands } from "../lib/odoo/catalog";
import { safeApiCall } from "../lib/odoo/safe";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<FinderQuery>;
}) {
  if (!(await hasOdooSession())) redirect("/login");

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
    <StorefrontShell>
      <ScrollToId
        id="catalog"
        enabled={Boolean(
          term
          || query.category
          || query.brand
          || query.min_moq
          || query.max_moq
          || query.availability
          || page > 1,
        )}
      />

      <CinematicHero
        collections={home.collections}
        focalX={homeHero?.heroFocalX}
        focalY={homeHero?.heroFocalY}
        frameScale={homeHero?.heroScale}
      />

      <ProductRail
        products={
          sort === "newest"
            ? home.newArrivals
            : listed.items.slice(0, 6)
        }
        index="01"
        eyebrow="New"
        title={
          sort === "oldest"
            ? "Oldest first."
            : sort === "name_asc"
              ? "Name A–Z."
              : sort === "name_desc"
                ? "Name Z–A."
                : "Newest arrivals."
        }
        sort={sort}
        query={query}
      />

      <section className="sf-section sf-home-search" id="search" aria-label="Product search">
        <div className="sf-home-catalog-tools is-search-only">
          <ProductFinder
            categories={categories}
            brands={brands}
            query={query}
            compact
            action="/"
            hash="#catalog"
          />
        </div>
      </section>

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

      {home.promos[0] ? (
        <HomeAdBanner
          promo={home.promos[0]}
          imageCategory={
            home.roots.find((category) => category.slug === home.promos[0]?.categorySlug)
            ?? home.roots[0]
            ?? null
          }
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

        <div className="sf-home-catalog-tools is-sort-only">
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

      <OffersSection
        promos={home.promos.slice(0, 3)}
        categories={home.roots}
      />

      {!catalogActive && home.favorites.length ? (
        <ProductRail
          products={home.favorites.slice(0, 6)}
          index="02"
          eyebrow="Starred"
          title="On the star list."
          showSort={false}
          sectionId="starred"
        />
      ) : null}

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
          showSort={false}
          sectionId="selected"
        />
      ) : null}

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
