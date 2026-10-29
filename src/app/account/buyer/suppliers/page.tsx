import Link from "next/link";
import { CatalogPager } from "../../../../components/storefront/catalog-pager";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import {
  buyerSuppliersHref,
  listBuyerSuppliers,
  parseBuyerNameSort,
  parseBuyerPage,
  type BuyerListQuery,
} from "../../../../lib/odoo/buyer";
import { safeApiCall } from "../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function BuyerSuppliersPage({
  searchParams,
}: {
  searchParams: Promise<BuyerListQuery>;
}) {
  await requireBuyer();
  const query = await searchParams;
  const term = query.q?.trim();
  const page = parseBuyerPage(query.page);
  const sort = parseBuyerNameSort(query.sort);
  const loaded = await safeApiCall(() => listBuyerSuppliers({
    q: term,
    page,
    pageSize: 20,
    sort,
  }));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const { items: suppliers, pagination } = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer">Back to procurement</Link>
        <p className="sf-kicker">Buyer</p>
        <h1>Suppliers.</h1>
        <p className="sf-count">{String(pagination.total).padStart(2, "0")} suppliers</p>
        {query.error === "notfound" && <p className="error">Supplier not found.</p>}
        <p><Link className="sf-btn" href="/account/buyer/suppliers/new"><span>Add supplier</span><span className="sf-arrow" aria-hidden>→</span></Link></p>
        <form className="sf-address-form sf-orders-filters" action="/account/buyer/suppliers" method="get">
          <label className="sf-field is-wide">
            Search
            <input type="search" name="q" defaultValue={term ?? ""} placeholder="Name, phone, email, tax" />
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
        {suppliers.length === 0 ? (
          <p>{term || sort ? "No matching suppliers." : "No suppliers yet."}</p>
        ) : (
          <ul className="sf-order-list sf-invoice-card">
            {suppliers.map((supplier) => (
              <li key={supplier.id}>
                <Link href={`/account/buyer/suppliers/${supplier.id}`}>
                  <div className="sf-invoice-row">
                    <div className="sf-invoice-col sf-col-main">
                      <span className="sf-invoice-number">{supplier.name}</span>
                      <span className="sf-invoice-dates">{supplier.city ?? "No city"}</span>
                      <span className="sf-invoice-order">{supplier.phone || supplier.mobile || supplier.email || "—"}</span>
                    </div>
                    <div className="sf-invoice-col sf-col-status">
                      <span className="sf-badge">{supplier.active ? "Active" : "Inactive"}</span>
                    </div>
                    <div className="sf-invoice-col sf-col-amounts">
                      <div className="sf-amount-group">
                        <span className="sf-label">Tax</span>
                        <span className="sf-value">{supplier.vat || "—"}</span>
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
          hrefForPage={(nextPage) => buyerSuppliersHref(query, { page: String(nextPage) })}
        />
      </main>
    </StorefrontShell>
  );
}
