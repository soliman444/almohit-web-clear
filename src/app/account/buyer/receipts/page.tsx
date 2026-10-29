import Link from "next/link";
import { CatalogPager } from "../../../../components/storefront/catalog-pager";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import {
  buyerReceiptsHref,
  listBuyerReceipts,
  parseBuyerDateSort,
  parseBuyerPage,
  parseBuyerReceiptStatus,
  type BuyerListQuery,
} from "../../../../lib/odoo/buyer";
import { safeApiCall } from "../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export default async function BuyerReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<BuyerListQuery>;
}) {
  await requireBuyer();
  const query = await searchParams;
  const term = query.q?.trim();
  const page = parseBuyerPage(query.page);
  const sort = parseBuyerDateSort(query.sort) ?? "newest";
  const status = parseBuyerReceiptStatus(query.status);
  const loaded = await safeApiCall(() => listBuyerReceipts({
    q: term,
    page,
    pageSize: 20,
    status,
    sort,
  }));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const { items: receipts, pagination } = loaded.data;
  const filtered = Boolean(term || status || query.sort);

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer">Back to procurement</Link>
        <p className="sf-kicker">Buyer</p>
        <h1>Incoming receipts.</h1>
        <p className="sf-count">{String(pagination.total).padStart(2, "0")} receipts</p>
        {query.error === "notfound" && <p className="error">Receipt not found.</p>}
        <form className="sf-address-form sf-orders-filters" action="/account/buyer/receipts" method="get">
          <label className="sf-field is-wide">
            Search
            <input type="search" name="q" defaultValue={term ?? ""} placeholder="Receipt or supplier" />
          </label>
          <label className="sf-field">
            Status
            <select name="status" defaultValue={status ?? ""}>
              <option value="">All</option>
              <option value="assigned">Ready</option>
              <option value="confirmed">Confirmed</option>
              <option value="waiting">Waiting</option>
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
        {receipts.length === 0 ? (
          <p>{filtered ? "No matching receipts." : "No incoming receipts yet. Confirm a purchase to create receipts."}</p>
        ) : (
          <ul className="sf-order-list sf-invoice-card">
            {receipts.map((receipt) => (
              <li key={receipt.id}>
                <Link href={`/account/buyer/receipts/${receipt.id}`}>
                  <div className="sf-invoice-row">
                    <div className="sf-invoice-col sf-col-main">
                      <span className="sf-invoice-number">{receipt.name}</span>
                      <span className="sf-invoice-dates">{receipt.supplier?.name ?? "No supplier"}</span>
                      <span className="sf-invoice-order">{receipt.purchase?.name ?? "No purchase"}</span>
                    </div>
                    <div className="sf-invoice-col sf-col-status">
                      <span className="sf-badge">{pretty(receipt.state)}</span>
                    </div>
                    <div className="sf-invoice-col sf-col-amounts">
                      <div className="sf-amount-group">
                        <span className="sf-label">Scheduled</span>
                        <span className="sf-value">
                          {receipt.scheduledDate ? String(receipt.scheduledDate).slice(0, 10) : "—"}
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
          hrefForPage={(nextPage) => buyerReceiptsHref(query, { page: String(nextPage) })}
        />
      </main>
    </StorefrontShell>
  );
}
