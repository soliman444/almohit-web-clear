import Link from "next/link";
import { StorefrontShell } from "../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../components/system/storefront-unavailable";
import { getCustomerPayments } from "../../../lib/commerce/payments";
import { safeApiCall } from "../../../lib/odoo/safe";
import { formatCompanyBase, formatDisplayMoney } from "../../../lib/currency/format";
import { getDisplayCurrencyState } from "../../../lib/currency/display";
import { requireMerchant } from "../../../lib/session/access";
import { formatInvoiceDate, pretty } from "../orders/[orderNumber]/page";

export const dynamic = "force-dynamic";

function journalLabel(type: string | null, name: string | null) {
  if (type === "bank") return name ? `Bank · ${name}` : "Bank";
  if (type === "cash") return name ? `Cash · ${name}` : "Cash";
  return name ?? "Payment";
}

export default async function PaymentsPage() {
  const session = await requireMerchant();
  const { code: currency, catalog } = await getDisplayCurrencyState();
  const loaded = session.kind === "odoo"
    ? await safeApiCall(() => getCustomerPayments())
    : { ok: true as const, data: [] };
  if (!loaded.ok) return <StorefrontUnavailable />;
  const payments = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account">Back to my account</Link>
        <p className="sf-kicker">Payments</p>
        <h1>Payment history.</h1>
        {session.kind !== "odoo" && <p>Payment history is available on the current trade storefront.</p>}
        {session.kind === "odoo" && payments.length === 0 && <p>No payments yet.</p>}
        <ul className="sf-order-list sf-invoice-card">
          {payments.map((payment) => {
            const unapplied = Number(payment.unappliedAmount.amount) > 0;
            return (
              <li key={payment.id}>
                <div className="sf-invoice-row">
                  <div className="sf-invoice-col sf-col-main">
                    <span className="sf-invoice-number">{payment.reference}</span>
                    <span className="sf-invoice-dates">
                      {payment.date ? formatInvoiceDate(payment.date) : "No date"}
                    </span>
                    <span className="sf-invoice-order">
                      {journalLabel(payment.journalType, payment.journalName)}
                    </span>
                    {payment.invoices.length === 0 ? (
                      <span className="sf-invoice-due">Not applied to an invoice yet.</span>
                    ) : (
                      payment.invoices.map((invoice) => (
                        <span key={invoice.id} className="sf-invoice-order">
                          Applied {formatDisplayMoney(invoice.appliedAmount.amount, currency, catalog)} to{" "}
                          <Link className="sf-text-link" href={`/account/invoices/${invoice.id}`}>
                            {invoice.name}
                          </Link>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="sf-invoice-col sf-col-status">
                    <span className="sf-badge">{pretty(payment.state)}</span>
                    {unapplied ? (
                      <span className="sf-invoice-dates">Unapplied balance</span>
                    ) : payment.invoices.length > 0 ? (
                      <span className="sf-invoice-dates">Applied</span>
                    ) : null}
                  </div>

                  <div className="sf-invoice-col sf-col-amounts">
                    <div className="sf-amount-group">
                      <span className="sf-label">Amount</span>
                      <span className="sf-value">
                        {formatDisplayMoney(payment.paymentAmount.amount, currency, catalog)}
                      </span>
                    </div>
                    <div className="sf-amount-group">
                      <span className="sf-label">{unapplied ? "Unapplied" : "Base"}</span>
                      <span className={`sf-value ${unapplied ? "sf-text-danger" : "muted"}`}>
                        {unapplied
                          ? formatDisplayMoney(payment.unappliedAmount.amount, currency, catalog)
                          : formatCompanyBase(payment.paymentAmount.amount, catalog)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </StorefrontShell>
  );
}
