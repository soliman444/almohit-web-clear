import Link from "next/link";
import { StorefrontShell } from "../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../components/system/storefront-unavailable";
import { getInvoices } from "../../../lib/commerce/invoices";
import { safeApiCall } from "../../../lib/odoo/safe";
import { formatCompanyBase, formatDisplayMoney } from "../../../lib/currency/format";
import { getDisplayCurrencyState } from "../../../lib/currency/display";
import { requireMerchant } from "../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = await requireMerchant();
  const { code: currency, catalog } = await getDisplayCurrencyState();
  const loaded = session.kind === "odoo"
    ? await safeApiCall(() => getInvoices())
    : { ok: true as const, data: [] };
  if (!loaded.ok) return <StorefrontUnavailable />;
  const invoices = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account">Back to my account</Link>
        <p className="sf-kicker">   Invoices</p>
        <h1>Invoice history.</h1>
        {session.kind !== "odoo" && <p>Invoice history is available on the current trade storefront.</p>}
        {session.kind === "odoo" && invoices.length === 0 && <p>No invoices yet.</p>}
        <ul className="sf-order-list sf-invoice-card ">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link href={`/account/invoices/${invoice.id}`}>
              <div className="sf-invoice-row">
                <div className="sf-invoice-col sf-col-main">
                  <span className="sf-invoice-number">{invoice.number}</span>
                  <span className="sf-invoice-dates">{invoice.invoiceDate ?? "No date"}</span>
                  {invoice.dueDate && <span className="sf-invoice-due">Due: {invoice.dueDate}</span>}
                  {invoice.order && <span className="sf-invoice-order">Order: {invoice.order.name}</span>}
                </div>
                
                <div className="sf-invoice-col sf-col-status">
                  <span className="sf-badge">{invoice.paymentState ?? invoice.state}</span>
                </div>
                
                <div className="sf-invoice-col sf-col-amounts">
                  <div className="sf-amount-group">
                    <span className="sf-label">Total</span>
                    <span className="sf-value">{formatDisplayMoney(invoice.amountTotal.amount, currency, catalog)}</span>
                  </div>
                  <div className="sf-amount-group">
                    <span className="sf-label">Remaining</span>
                    <span className="sf-value sf-text-danger">{formatDisplayMoney(invoice.amountResidual.amount, currency, catalog)}</span>
                  </div>
                </div>
              </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </StorefrontShell>
  );
}
