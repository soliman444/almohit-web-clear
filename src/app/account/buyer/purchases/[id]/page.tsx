import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { confirmBuyerPurchaseAction } from "../../../../../lib/actions/buyer";
import { parseBuyerFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { ApiClientError } from "../../../../../lib/odoo/errors";
import { getBuyerPurchase, isPurchaseEditable } from "../../../../../lib/odoo/buyer";
import { parseOdooRecordId } from "../../../../../lib/odoo/catalog";
import { safeApiCall } from "../../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export default async function BuyerPurchaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FormErrorQuery & { created?: string; confirmed?: string }>;
}) {
  await requireBuyer();
  const { id } = await params;
  const query = await searchParams;
  const formError = parseBuyerFormError(query);
  const loaded = await safeApiCall(() => loadPurchase(id));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const purchase = loaded.data;
  const canConfirm = isPurchaseEditable(purchase.state);

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer/purchases">All purchases</Link>
        <p className="sf-kicker">Purchase</p>
        <h1>{purchase.name}</h1>
        {query.created && <p className="sf-invoice-banner" role="status">Draft purchase created.</p>}
        {query.confirmed && <p className="sf-invoice-banner" role="status">Purchase confirmed. Incoming receipts are ready.</p>}
        <FormErrorBanner error={formError} />

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table sf-delivery-meta">
            <tbody>
              <tr><th scope="row">Supplier</th><td>{purchase.supplier?.name || "—"}</td></tr>
              <tr><th scope="row">State</th><td><span className="sf-badge">{pretty(purchase.state)}</span></td></tr>
              <tr><th scope="row">Order date</th><td>{purchase.dateOrder ? String(purchase.dateOrder).slice(0, 10) : "—"}</td></tr>
              <tr><th scope="row">Currency</th><td>{purchase.currency?.name || "—"}</td></tr>
              <tr><th scope="row">Buyer</th><td>{purchase.buyer?.name || "—"}</td></tr>
              <tr><th scope="row">Notes</th><td>{purchase.notes || "—"}</td></tr>
              <tr>
                <th scope="row">Untaxed</th>
                <td>
                  {purchase.amountUntaxed.toFixed(2)}
                  {purchase.currency ? ` ${purchase.currency.name}` : ""}
                </td>
              </tr>
              <tr>
                <th scope="row">Tax</th>
                <td>
                  {purchase.amountTax.toFixed(2)}
                  {purchase.currency ? ` ${purchase.currency.name}` : ""}
                </td>
              </tr>
              <tr>
                <th scope="row">Total</th>
                <td>
                  <strong>
                    {purchase.amountTotal.toFixed(2)}
                    {purchase.currency ? ` ${purchase.currency.name}` : ""}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="sf-delivery-section">
          <h2>Lines</h2>
          <div className="sf-cart-table-wrap">
            <table className="sf-cart-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="is-num">Qty</th>
                  <th scope="col">UoM</th>
                  <th scope="col">Planned date</th>
                  <th scope="col" className="is-num">Price</th>
                  <th scope="col" className="is-num">Subtotal</th>
                  <th scope="col" className="is-num">Received</th>
                </tr>
              </thead>
              <tbody>
                {purchase.lines.map((line) => (
                  <tr key={line.id}>
                    <th scope="row">
                      {line.product.name}
                      {line.product.defaultCode ? ` (${line.product.defaultCode})` : ""}
                    </th>
                    <td className="is-num">{line.quantity}</td>
                    <td>{line.uom?.name || "—"}</td>
                    <td>{line.plannedDate ? String(line.plannedDate).slice(0, 10) : "—"}</td>
                    <td className="is-num">
                      {line.priceUnit.toFixed(2)}
                      {purchase.currency ? ` ${purchase.currency.name}` : ""}
                    </td>
                    <td className="is-num">
                      {line.subtotal.toFixed(2)}
                      {purchase.currency ? ` ${purchase.currency.name}` : ""}
                    </td>
                    <td className="is-num">{line.receivedQty} / {line.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {purchase.images.length > 0 && (
          <section className="sf-delivery-section">
            <h2>Photos</h2>
            <div className="sf-buyer-images">
              {purchase.images.map((image) => (
                <a key={image.id} href={image.url} target="_blank" rel="noreferrer">
                  <Image src={image.url} alt={image.name || "Purchase photo"} width={160} height={160} unoptimized />
                </a>
              ))}
            </div>
          </section>
        )}

        {purchase.receipts.length > 0 && (
          <section className="sf-delivery-section">
            <h2>Receipts</h2>
            <ul className="sf-linked-list">
              {purchase.receipts.map((receipt) => (
                <li key={receipt.id}>
                  <Link className="sf-linked-item" href={`/account/buyer/receipts/${receipt.id}`}>
                    <span className="sf-linked-name">{receipt.name}</span>
                    <span className="sf-linked-status">{pretty(receipt.state)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {canConfirm && (
          <OnceForm action={confirmBuyerPurchaseAction}>
            <input type="hidden" name="purchaseId" value={purchase.id} />
            <OnceSubmit className="sf-btn" pendingLabel="Confirming…">
              <span>Confirm purchase</span>
            </OnceSubmit>
          </OnceForm>
        )}
      </main>
    </StorefrontShell>
  );
}

async function loadPurchase(id: string) {
  const purchaseId = parseOdooRecordId(id);
  if (!purchaseId) notFound();
  try {
    return await getBuyerPurchase(purchaseId);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.code === "PURCHASE_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}
