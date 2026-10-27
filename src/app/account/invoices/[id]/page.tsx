import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoicePayPanel } from "../../../../components/storefront/invoice-pay-panel";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import { ApiClientError } from "../../../../lib/odoo/errors";
import { getInvoice, getInvoicePaymentProviders, invoiceAllowsOnlinePay } from "../../../../lib/commerce/invoices";
import { safeApiCall } from "../../../../lib/odoo/safe";
import { companyCurrencyCode, formatCompanyBase, formatDisplayMoney } from "../../../../lib/currency/format";
import { getDisplayCurrencyState } from "../../../../lib/currency/display";
import { requireMerchant } from "../../../../lib/session/access";
import { pretty, formatInvoiceDate } from "../../../../app/account/orders/[orderNumber]/page";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMerchant();
  const { code: currency, catalog } = await getDisplayCurrencyState();
  const { id } = await params;
  const loaded = await safeApiCall(() => loadInvoice(id));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const { invoice, providers } = loaded.data;
  const money = (amount: string) => formatDisplayMoney(amount, currency, catalog);
  const showPay = invoiceAllowsOnlinePay(invoice, providers);

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <div className="sf-page-container">
          <div className="sf-invoice-toolbar">
            <Link className="sf-text-link sf-back-link" href="/account/invoices">
              &larr; All invoices
            </Link>
            <p className="sf-kicker">{pretty(invoice.paymentState ?? invoice.state)}</p>
          </div>

          <article className="sf-invoice-paper" aria-label={`Invoice ${invoice.number}`}>
            <header className="sf-invoice-head">
              <div className="sf-invoice-brand-col">
                <h1 className="sf-brand-name">Almohit</h1>
                <p className="muted">Wholesale</p>
                <p className="muted">y.barakat@m-arabi.com</p>
              </div>
              <div className="sf-invoice-number-col">
                <p className="sf-kicker">INVOICE</p>
                <h2 className="sf-invoice-id">{invoice.number}</h2>
                <p className="muted">{formatInvoiceDate(invoice.invoiceDate ?? "")}</p>
              </div>
            </header>

            <div className="sf-invoice-details-grid">
              <div className="sf-invoice-facts">
                <div className="sf-fact-row">
                  <span className="sf-fact-label">Status</span>
                  <span className="sf-fact-value">{pretty(invoice.state)}</span>
                </div>
                <div className="sf-fact-row">
                  <span className="sf-fact-label">Payment</span>
                  <span className="sf-fact-value">{pretty(invoice.paymentState ?? "")}</span>
                </div>
                {invoice.paymentTerm && (
                  <div className="sf-fact-row">
                    <span className="sf-fact-label">Terms</span>
                    <span className="sf-fact-value">{invoice.paymentTerm.name.trim()}</span>
                  </div>
                )}
                {invoice.order && (
                  <div className="sf-fact-row">
                    <span className="sf-fact-label">Order</span>
                    <span className="sf-fact-value">
                      <Link className="sf-text-link" href={`/account/orders/${invoice.order.name}`}>
                        {invoice.order.name}
                      </Link>
                    </span>
                  </div>
                )}
              </div>
                <div className="sf-invoice-facts">
                  <div className="sf-fact-row">
                    <span className="sf-fact-label">Invoice date</span>
                    <span className="sf-fact-value">{formatInvoiceDate(invoice.invoiceDate ?? "")}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="sf-fact-row">
                      <span className="sf-fact-label">Due date</span>
                      <span className="sf-fact-value">{formatInvoiceDate(invoice.dueDate)}</span>
                    </div>
                  )}
                  <div className="sf-fact-row">
                    <span className="sf-fact-label">Remaining</span>
                    <span className="sf-fact-value">{money(invoice.amountResidual.amount)}</span>
                  </div>
                </div>
            </div>

            <div className="sf-invoice-table-wrap">
              <table className="sf-invoice-table">
                <thead>
                  <tr>
                    <th scope="col">Description</th>
                    <th scope="col" className="is-num">Qty</th>
                    <th scope="col" className="is-num">Price</th>
                    <th scope="col" className="is-num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={`${item.name}-${index}`}>
                      <td>
                        <p className="sf-item-name">{item.name || "—"}</p>
                        {item.uom ? <p className="sf-item-variant">{item.uom}</p> : null}
                      </td>
                      <td className="is-num">{item.quantity}</td>
                      <td className="is-num">{money(item.unitPrice.amount)}</td>
                      <td className="is-num sf-item-total">{money(item.subtotal.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sf-invoice-summary-wrap">
              <div className="sf-invoice-summary">
                <div className="sf-summary-row">
                  <span className="sf-summary-label">Untaxed</span>
                  <span className="sf-summary-value">{money(invoice.amountUntaxed.amount)}</span>
                </div>
                <div className="sf-summary-row">
                  <span className="sf-summary-label">Tax</span>
                  <span className="sf-summary-value">{money(invoice.amountTax.amount)}</span>
                </div>
                <div className="sf-summary-row sf-summary-grand-total">
                  <span className="sf-summary-label">Total</span>
                  <span className="sf-summary-value">{money(invoice.amountTotal.amount)}</span>
                </div>
                {invoice.paidAmount && Number(invoice.paidAmount.amount) > 0 && (
                  <div className="sf-summary-row">
                    <span className="sf-summary-label">Paid</span>
                    <span className="sf-summary-value">{money(invoice.paidAmount.amount)}</span>
                  </div>
                )}
                <div className="sf-summary-row">
                  <span className="sf-summary-label">Remaining</span>
                  <span className="sf-summary-value">{money(invoice.amountResidual.amount)}</span>
                </div>
                {currency !== companyCurrencyCode(catalog) && (
                  <div className="sf-summary-row sf-summary-base">
                    <span className="sf-summary-label">Base Currency</span>
                    <span className="sf-summary-value">{formatCompanyBase(invoice.amountTotal.amount, catalog)}</span>
                  </div>
                )}
              </div>
            </div>

            {invoice.paymentTerm && (
              <div className="sf-invoice-footer">
                <p className="sf-invoice-note">
                  <strong>Payment terms:</strong> {invoice.paymentTerm.name.trim()}
                </p>
              </div>
            )}

            {invoice.payments.length > 0 && (
              <div className="sf-invoice-linked">
                <h3 className="sf-linked-title">Payments</h3>
                <ul className="sf-linked-list">
                  {invoice.payments.map((payment) => (
                    <li key={payment.id}>
                      <span className="sf-linked-item">
                        <span className="sf-linked-name">
                          {payment.date ? formatInvoiceDate(payment.date) : "No date"} · {money(payment.appliedAmount.amount)}
                        </span>
                        <span className="sf-linked-status">{pretty(payment.state)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          <section className="sf-invoice-activity">
            <h2 className="sf-section-title">Online payment</h2>
            {showPay ? (
              <InvoicePayPanel
                invoiceId={invoice.id}
                paymentState={invoice.paymentState}
                residual={invoice.amountResidual.amount}
                providers={providers}
              />
            ) : (
              <p>
                {invoice.paymentState === "paid"
                  ? "This invoice is paid."
                  : "Online payment is not required to keep this order valid. Pay by the due date according to your terms, or when a provider is available."}
              </p>
            )}
          </section>
        </div>
      </main>
    </StorefrontShell>
  );
}

async function loadInvoice(id: string) {
  try {
    const [invoice, providers] = await Promise.all([
      getInvoice(id),
      getInvoicePaymentProviders(id),
    ]);
    return { invoice, providers };
  } catch (error) {
    if (error instanceof ApiClientError && (error.statusCode === 404 || error.code === "INVOICE_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}
