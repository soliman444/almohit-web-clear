import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintInvoiceButton } from "../../../../components/storefront/print-invoice-button";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import { getOrder } from "../../../../lib/commerce/orders";
import { ApiClientError } from "../../../../lib/odoo/errors";
import { safeApiCall } from "../../../../lib/odoo/safe";
import { companyCurrencyCode, formatCompanyBase, formatDisplayMoney } from "../../../../lib/currency/format";
import { getDisplayCurrencyState } from "../../../../lib/currency/display";
import { requireMerchant } from "../../../../lib/session/access";
import type { StorefrontOrderDetail } from "../../../../lib/odoo/orders";

export const dynamic = "force-dynamic";

export function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export function formatInvoiceDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function AddressBlock({
  title,
  address,
}: {
  title: string;
  address: StorefrontOrderDetail["shipping"] | null | undefined;
}) {
  if (!address || (!address.recipient && !address.line1)) return null;
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  const cityLine = [address.city, address.region, address.postalCode].filter(Boolean).join(" ");
  return (
    <div className="sf-address-block">
      <h3 className="sf-address-title">{title}</h3>
      {address.recipient ? <p className="sf-address-name">{address.recipient}</p> : null}
      {street ? <p className="sf-address-line">{street}</p> : null}
      {cityLine ? <p className="sf-address-line">{cityLine}</p> : null}
      {address.country ? <p className="sf-address-line">{address.country}</p> : null}
      {address.phone ? <p className="sf-address-phone">{address.phone}</p> : null}
    </div>
  );
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  await requireMerchant();
  const { code: currency, catalog } = await getDisplayCurrencyState();
  const { orderNumber } = await params;
  const { placed } = await searchParams;
  const loaded = await safeApiCall(() => loadOwnedOrder(orderNumber));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const order = loaded.data;
  const odoo = order as StorefrontOrderDetail;
  const invoices = odoo.invoices ?? [];
  const invoiceCount = odoo.invoiceCount ?? 0;
  const money = (amount: string) => formatDisplayMoney(amount, currency, catalog);
  const billing = odoo.billing ?? order.shipping;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <div className="sf-page-container">
          
          {/* شريط الأدوات العلوي */}
          <div className="sf-invoice-toolbar">
            <Link className="sf-text-link sf-back-link" href="/account/orders">
              &larr; All orders
            </Link>
            <PrintInvoiceButton orderNumber={order.orderNumber} />
          </div>

          {placed && (
            <div className="sf-alert sf-alert-success" role="status">
              Order confirmed
            </div>
          )}

          {/* ورقة الفاتورة */}
          <article className="sf-invoice-paper" aria-label={`Invoice ${order.orderNumber}`}>
            
            <header className="sf-invoice-head">
              <div className="sf-invoice-brand-col">
                <h1 className="sf-brand-name">Almohit</h1>
                <p className="muted">Wholesale</p>
                <p className="muted">y.barakat@m-arabi.com</p>
              </div>
              <div className="sf-invoice-number-col">
                <p className="sf-kicker">INVOICE</p>
                <h2 className="sf-invoice-id">{order.orderNumber}</h2>
                <p className="muted">{formatInvoiceDate(order.createdAt)}</p>
              </div>
            </header>

            <div className="sf-invoice-details-grid">
              <div className="sf-invoice-facts">
                <div className="sf-fact-row">
                  <span className="sf-fact-label">Status</span>
                  <span className="sf-fact-value">{pretty(order.status)}</span>
                </div>
                <div className="sf-fact-row">
                  <span className="sf-fact-label">Payment</span>
                  <span className="sf-fact-value">
                    {pretty(order.paymentStatus)}
                    {invoiceCount ? ` · ${invoiceCount} invoice${invoiceCount === 1 ? "" : "s"}` : ""}
                  </span>
                </div>
                {odoo.paymentTerm && (
                  <div className="sf-fact-row">
                    <span className="sf-fact-label">Terms</span>
                    <span className="sf-fact-value">{odoo.paymentTerm.name.trim()}</span>
                  </div>
                )}
                {odoo.deliveryStatus && (
                  <div className="sf-fact-row">
                    <span className="sf-fact-label">Delivery</span>
                    <span className="sf-fact-value">
                      {pretty(odoo.deliveryStatus)}
                      {odoo.deliveryReference ? ` · ${odoo.deliveryReference}` : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="sf-invoice-parties">
                <AddressBlock title="Billed To" address={billing} />
                <AddressBlock title="Shipped To" address={order.shipping} />
              </div>
            </div>

            {/* جدول المنتجات */}
            <div className="sf-invoice-table-wrap">
              <table className="sf-invoice-table">
                <thead>
                  <tr>
                    <th scope="col">Description</th>
                    <th scope="col">SKU</th>
                    <th scope="col" className="is-num">Qty</th>
                    <th scope="col" className="is-num">Price</th>
                    <th scope="col" className="is-num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <p className="sf-item-name">{item.productName}</p>
                        {item.variantName ? <p className="sf-item-variant">{item.variantName}</p> : null}
                        {item.attributes.length > 0 ? (
                          <p className="sf-item-attrs">
                            {item.attributes.map((entry) => `${entry.name}: ${entry.value}`).join(" · ")}
                          </p>
                        ) : null}
                      </td>
                      <td className="is-sku">{item.sku || "—"}</td>
                      <td className="is-num">{item.quantity}</td>
                      <td className="is-num">{money(item.unitPrice.amount)}</td>
                      <td className="is-num sf-item-total">{money(item.lineTotal.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ملخص الإجمالي */}
            <div className="sf-invoice-summary-wrap">
              <div className="sf-invoice-summary">
                <div className="sf-summary-row">
                  <span className="sf-summary-label">Subtotal</span>
                  <span className="sf-summary-value">{money(order.totals.subtotal.amount)}</span>
                </div>
                <div className="sf-summary-row">
                  <span className="sf-summary-label">Tax</span>
                  <span className="sf-summary-value">{money(order.totals.tax.amount)}</span>
                </div>
                <div className="sf-summary-row sf-summary-grand-total">
                  <span className="sf-summary-label">Total</span>
                  <span className="sf-summary-value">{money(order.totals.total.amount)}</span>
                </div>
                {currency !== companyCurrencyCode(catalog) && (
                  <div className="sf-summary-row sf-summary-base">
                    <span className="sf-summary-label">Base Currency</span>
                    <span className="sf-summary-value">{formatCompanyBase(order.totals.total.amount, catalog)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ملاحظات */}
            {(odoo.paymentTerm || order.customerNotes) && (
              <div className="sf-invoice-footer">
                {odoo.paymentTerm && (
                  <p className="sf-invoice-note">
                    <strong>Payment terms:</strong> {odoo.paymentTerm.name.trim()}. An unpaid invoice does not cancel this order.
                  </p>
                )}
                {order.customerNotes && (
                  <p className="sf-invoice-note">
                    <strong>Notes:</strong> {order.customerNotes}
                  </p>
                )}
              </div>
            )}

            {/* الفواتير المرتبطة */}
            {invoices.length > 0 && (
              <div className="sf-invoice-linked">
                <h3 className="sf-linked-title">Linked Invoices</h3>
                <ul className="sf-linked-list">
                  {invoices.map((invoice) => (
                    <li key={invoice.id}>
                      <Link href={`/account/invoices/${invoice.id}`} className="sf-linked-item">
                        <span className="sf-linked-name">{invoice.name}</span>
                        <span className="sf-linked-status">{pretty(invoice.paymentState ?? invoice.state)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {/* سجل الحالة */}
          {order.history.length > 0 && (
            <section className="sf-invoice-activity">
              <h2 className="sf-section-title">Order Status History</h2>
              <ol className="sf-timeline">
                {order.history.map((entry) => (
                  <li key={entry.id} className="sf-timeline-item">
                    <div className="sf-timeline-dot"></div>
                    <div className="sf-timeline-content">
                      <b className="sf-timeline-status">{pretty(entry.status)}</b>
                      <p className="sf-timeline-date">
                        {new Date(entry.createdAt).toLocaleString("en-GB")}
                        {entry.notes ? ` · ${entry.notes}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </main>
    </StorefrontShell>
  );
}

async function loadOwnedOrder(orderNumber: string) {
  try {
    return await getOrder(orderNumber);
  } catch (error) {
    if (error instanceof ApiClientError && (error.statusCode === 404 || error.code === "ORDER_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}