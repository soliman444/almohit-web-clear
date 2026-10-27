import Link from "next/link";
import { CatalogPager } from "../../../components/storefront/catalog-pager";
import { OrdersFilters } from "../../../components/storefront/orders-filters";
import { StorefrontShell } from "../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../components/system/storefront-unavailable";
import { getOrders } from "../../../lib/commerce/orders";
import { safeApiCall } from "../../../lib/odoo/safe";
import { formatCompanyBase, formatDisplayMoney } from "../../../lib/currency/format";
import { getDisplayCurrencyState } from "../../../lib/currency/display";
import {
  ordersListHref,
  parseOrderDate,
  parseOrderPage,
  parseOrderSort,
  parseOrderState,
  type OrdersQuery,
} from "../../../lib/odoo/orders";
import { requireMerchant } from "../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersQuery>;
}) {
  const session = await requireMerchant();
  const query = await searchParams;
  const term = query.q?.trim();
  const state = parseOrderState(query.state);
  const dateFrom = parseOrderDate(query.date_from);
  const dateTo = parseOrderDate(query.date_to);
  const sort = parseOrderSort(query.sort);
  const page = parseOrderPage(query.page);
  const { code: currency, catalog } = await getDisplayCurrencyState();
  const loaded = await safeApiCall(() => getOrders({
    q: term,
    state,
    dateFrom,
    dateTo,
    sort,
    page,
  }));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const { items: orders, pagination } = loaded.data;
  const hrefFor = (order: (typeof orders)[number]) =>
    session.kind === "odoo" ? order.id : order.orderNumber;
  const filtered = Boolean(term || state || dateFrom || dateTo || sort);

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account">Back to my account</Link>
        <p className="sf-kicker">Orders</p>
        <h1>Order history.</h1>
        <p className="sf-count">{String(pagination.total).padStart(2, "0")} orders</p>
        <OrdersFilters query={query} />
        {orders.length === 0 && (
          <p>{filtered ? "No matching orders." : "No orders yet."}</p>
        )}
        <ul className="sf-order-list sf-invoice-card">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/account/orders/${hrefFor(order)}`}>
                <div className="sf-invoice-row">
                  <div className="sf-invoice-col sf-col-main">
                    <span className="sf-invoice-number">{order.orderNumber}</span>
                    <span className="sf-invoice-dates">
                      {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </span>
                    <span className="sf-invoice-order">
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="sf-invoice-col sf-col-status">
                    <span className="sf-badge">{pretty(order.status)}</span>
                    <span className="sf-invoice-dates">{pretty(order.payment.status)}</span>
                  </div>

                  <div className="sf-invoice-col sf-col-amounts">
                    <div className="sf-amount-group">
                      <span className="sf-label">Total</span>
                      <span className="sf-value">
                        {formatDisplayMoney(order.total.amount, currency, catalog)}
                      </span>
                    </div>
                    <div className="sf-amount-group">
                      <span className="sf-label">Base</span>
                      <span className="sf-value muted">
                        {formatCompanyBase(order.total.amount, catalog)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <CatalogPager
          pagination={pagination}
          hrefForPage={(nextPage) => ordersListHref(query, { page: String(nextPage) })}
        />
      </main>
    </StorefrontShell>
  );
}

function pretty(value: string) {
  return value.replaceAll("_", " ");
}
