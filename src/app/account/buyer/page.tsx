import Link from "next/link";
import { StorefrontShell } from "../../../components/storefront/shell";
import { requireBuyer } from "../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function BuyerHubPage() {
  await requireBuyer();

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account">Back to my account</Link>
        <p className="sf-kicker">Buyer</p>
        <h1>Procurement.</h1>
        <p className="muted">Source from farmers and suppliers into inventory. Sales catalog stays separate.</p>
        <div className="sf-buyer-hub">
          <Link className="sf-btn" href="/account/buyer/suppliers">
            <span>Suppliers</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
          <Link className="sf-btn" href="/account/buyer/products">
            <span>Procurement products</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
          <Link className="sf-btn" href="/account/buyer/purchases">
            <span>Purchase orders</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
          <Link className="sf-btn" href="/account/buyer/receipts">
            <span>Incoming receipts</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
        </div>
      </main>
    </StorefrontShell>
  );
}
