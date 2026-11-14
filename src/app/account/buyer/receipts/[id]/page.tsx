import Link from "next/link";
import { notFound } from "next/navigation";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { ApiClientError } from "../../../../../lib/odoo/errors";
import { getBuyerReceipt } from "../../../../../lib/odoo/buyer";
import { parseOdooRecordId } from "../../../../../lib/odoo/catalog";
import { safeApiCall } from "../../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export default async function BuyerReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBuyer();
  const { id } = await params;
  const loaded = await safeApiCall(() => loadReceipt(id));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const receipt = loaded.data;

  return (
    <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer/receipts">All receipts</Link>
        <p className="sf-kicker">Receipt</p>
        <h1>{receipt.name}</h1>
        <p className="sf-heading">
          Tracking only — warehouse managers validate incoming stock.
        </p>

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table sf-delivery-meta">
            <tbody>
              <tr><th scope="row">Supplier</th><td>{receipt.supplier?.name || "—"}</td></tr>
              <tr>
                <th scope="row">Purchase</th>
                <td>
                  {receipt.purchase ? (
                    <Link className="sf-text-link" href={`/account/buyer/purchases/${receipt.purchase.id}`}>
                      {receipt.purchase.name}
                    </Link>
                  ) : "—"}
                </td>
              </tr>
              <tr><th scope="row">Status</th><td><span className="sf-badge">{pretty(receipt.state)}</span></td></tr>
              <tr><th scope="row">Scheduled</th><td>{receipt.scheduledDate ? String(receipt.scheduledDate).slice(0, 16) : "—"}</td></tr>
              <tr><th scope="row">Done</th><td>{receipt.dateDone ? String(receipt.dateDone).slice(0, 16) : "Not yet"}</td></tr>
            </tbody>
          </table>
        </div>

        <section className="sf-delivery-section">
          <h2>Moves</h2>
          <div className="sf-cart-table-wrap">
            <table className="sf-cart-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Destination</th>
                  <th scope="col" className="is-num">Ordered</th>
                  <th scope="col" className="is-num">Received</th>
                  <th scope="col" className="is-num">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {receipt.lines.map((line) => (
                  <tr key={line.moveId}>
                    <th scope="row">{line.product.name}</th>
                    <td>{line.destinationLocation?.name || "—"}</td>
                    <td className="is-num">
                      {line.orderedQty}{line.uom ? ` ${line.uom.name}` : ""}
                    </td>
                    <td className="is-num">
                      {line.receivedQty}{line.uom ? ` ${line.uom.name}` : ""}
                    </td>
                    <td className="is-num">
                      {line.remainingQty}{line.uom ? ` ${line.uom.name}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {receipt.backorders.length > 0 && (
          <section className="sf-delivery-section">
            <h2>Backorders</h2>
            <ul className="sf-linked-list">
              {receipt.backorders.map((row) => (
                <li key={row.id}>
                  <Link className="sf-linked-item" href={`/account/buyer/receipts/${row.id}`}>
                    <span className="sf-linked-name">{row.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
  );
}

async function loadReceipt(id: string) {
  const pickingId = parseOdooRecordId(id);
  if (!pickingId) notFound();
  try {
    return await getBuyerReceipt(pickingId);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.code === "RECEIPT_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}
