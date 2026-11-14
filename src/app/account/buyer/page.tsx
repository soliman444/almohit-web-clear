import { requireBuyer } from "../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function BuyerHubPage() {
  await requireBuyer();

  return (
    <main className="sf-account sf-invoice-page sf-desk-page">
      <p className="sf-kicker">Buyer</p>
      <h1>Procurement.</h1>
      <p className="muted">
        Source from farmers and suppliers into inventory. Use the side menu to open suppliers, products, purchases, and receipts.
      </p>
    </main>
  );
}
