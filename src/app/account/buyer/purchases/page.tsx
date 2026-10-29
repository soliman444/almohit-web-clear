import Link from "next/link";
import { CatalogPager } from "../../../../components/storefront/catalog-pager";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import {
  buyerPurchasesHref,
  listBuyerPurchases,
  parseBuyerDateSort,
  parseBuyerPage,
  parseBuyerPurchaseState,
  type BuyerListQuery,
} from "../../../../lib/odoo/buyer";
import { safeApiCall } from "../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export default async function BuyerPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<BuyerListQuery>;
}) {
  await requireBuyer();
  const query = await searchParams;
  const term = query.q?.trim();
  const page = parseBuyerPage(query.page);
  const sort = parseBuyerDateSort(query.sort) ?? "newest";
  const state = parseBuyerPurchaseState(query.state);
  const loaded = await safeApiCall(() => listBuyerPurchases({
    q: term,
    page,
    pageSize: 20,
    state,
    sort,
  }));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const { items: purchases, pagination } = loaded.data;
  const filtered = Boolean(term || state || query.sort);

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer">Back to procurement</Link>
        <p className="sf-kicker">Buyer</p>
        <h1>Purchase orders.</h1>
        <p className="sf-count">{String(pagination.total).padStart(2, "0")} purchases</p>
        {query.error === "notfound" && <p className="error">Purchase not found.</p>}
        <p><Link className="sf-btn" href="/account/buyer/purchases/new"><span>New purchase</span><span className="sf-arrow" aria-hidden>→</span></Link></p>
        <form className="sf-address-form sf-orders-filters" action="/account/buyer/purchases" method="get">
          <label className="sf-field is-wide">
            Search
            <input type="search" name="q" defaultValue={term ?? ""} placeholder="PO number or supplier" />
          </label>
          <label className="sf-field">
            State
            <select name="state" defaultValue={state ?? ""}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="to approve">To approve</option>
              <option value="purchase">Purchase</option>
              <option value="done">Done</option>
              <option value="cancel">Cancel</option>
            </select>
          </label>
          <label className="sf-field">
            Sort
            <select name="sort" defaultValue={query.sort === "oldest" ? "oldest" : "newest"}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
          <button className="sf-btn" type="submit"><span>Apply</span></button>
        </form>
        {purchases.length === 0 ? (
          <p>{filtered ? "No matching purchases." : "No purchases yet."}</p>
        ) : (
          <ul className="sf-order-list sf-invoice-card">
            {purchases.map((purchase) => (
              <li key={purchase.id}>
                <Link href={`/account/buyer/purchases/${purchase.id}`}>
                  <div className="sf-invoice-row">
                    <div className="sf-invoice-col sf-col-main">
                      <span className="sf-invoice-number">{purchase.name}</span>
                      <span className="sf-invoice-dates">{purchase.supplier?.name ?? "No supplier"}</span>
                      <span className="sf-invoice-order">
                        {purchase.dateOrder ? String(purchase.dateOrder).slice(0, 10) : "No date"}
                        {purchase.receiptCount ? ` · ${purchase.receiptCount} receipt${purchase.receiptCount === 1 ? "" : "s"}` : ""}
                      </span>
                    </div>
                    <div className="sf-invoice-col sf-col-status">
                      <span className="sf-badge">{pretty(purchase.state)}</span>
                    </div>
                    <div className="sf-invoice-col sf-col-amounts">
                      <div className="sf-amount-group">
                        <span className="sf-label">Total</span>
                        <span className="sf-value">
                          {purchase.amountTotal.toFixed(2)}
                          {purchase.currency ? ` ${purchase.currency.name}` : ""}
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
          hrefForPage={(nextPage) => buyerPurchasesHref(query, { page: String(nextPage) })}
        />
      </main>
    </StorefrontShell>
  );
}
