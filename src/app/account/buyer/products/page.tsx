import Link from "next/link";
import { CatalogPager } from "../../../../components/storefront/catalog-pager";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import {
  buyerProductsHref,
  listBuyerProducts,
  parseBuyerNameSort,
  parseBuyerPage,
  type BuyerListQuery,
} from "../../../../lib/odoo/buyer";
import { safeApiCall } from "../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function BuyerProductsPage({
  searchParams,
}: {
  searchParams: Promise<BuyerListQuery>;
}) {
  await requireBuyer();
  const query = await searchParams;
  const term = query.q?.trim();
  const page = parseBuyerPage(query.page);
  const sort = parseBuyerNameSort(query.sort);
  const loaded = await safeApiCall(() => listBuyerProducts({
    q: term,
    page,
    pageSize: 20,
    sort,
  }));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const { items: products, pagination } = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer">Back to procurement</Link>
        <p className="sf-kicker">Buyer</p>
        <h1>Procurement products.</h1>
        <p className="sf-count">{String(pagination.total).padStart(2, "0")} products</p>
        {query.error === "notfound" && <p className="error">Product not found.</p>}
        <p><Link className="sf-btn" href="/account/buyer/products/new"><span>Add product</span><span className="sf-arrow" aria-hidden>→</span></Link></p>
        <form className="sf-address-form sf-orders-filters" action="/account/buyer/products" method="get">
          <label className="sf-field is-wide">
            Search
            <input type="search" name="q" defaultValue={term ?? ""} placeholder="Name, code, barcode" />
          </label>
          <label className="sf-field">
            Sort
            <select name="sort" defaultValue={sort ?? ""}>
              <option value="">Default</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
          <button className="sf-btn" type="submit"><span>Apply</span></button>
        </form>
        {products.length === 0 ? (
          <p>{term || sort ? "No matching products." : "No purchasable products yet."}</p>
        ) : (
          <ul className="sf-order-list sf-invoice-card">
            {products.map((product) => (
              <li key={product.id}>
                <Link href={`/account/buyer/products/${product.id}`}>
                  <div className="sf-invoice-row">
                    <div className="sf-invoice-col sf-col-main">
                      <span className="sf-invoice-number">{product.name}</span>
                      <span className="sf-invoice-dates">{product.defaultCode || "No code"}</span>
                      <span className="sf-invoice-order">{product.category?.name ?? "No category"}</span>
                    </div>
                    <div className="sf-invoice-col sf-col-status">
                      <span className="sf-badge">{product.type}</span>
                    </div>
                    <div className="sf-invoice-col sf-col-amounts">
                      <div className="sf-amount-group">
                        <span className="sf-label">Last purchase</span>
                        <span className="sf-value">
                          {product.lastPurchasePrice == null ? "—" : product.lastPurchasePrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <CatalogPager
          pagination={pagination}
          hrefForPage={(nextPage) => buyerProductsHref(query, { page: String(nextPage) })}
        />
      </main>
    </StorefrontShell>
  );
}
