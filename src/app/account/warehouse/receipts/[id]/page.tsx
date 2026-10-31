import Link from "next/link";
import { notFound } from "next/navigation";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { receiveWarehouseReceiptAction } from "../../../../../lib/actions/warehouse";
import { parseWarehouseFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { ApiClientError } from "../../../../../lib/odoo/errors";
import { getWarehouseReceipt } from "../../../../../lib/odoo/warehouse";
import { parseOdooRecordId } from "../../../../../lib/odoo/catalog";
import { safeWarehouseCall } from "../../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

async function loadReceipt(id: string) {
  const recordId = parseOdooRecordId(id);
  if (!recordId) notFound();
  try {
    return await getWarehouseReceipt(recordId);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.code === "RECEIPT_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}

export default async function WarehouseReceiptDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FormErrorQuery & { received?: string }>;
}) {
  await requireWarehouseManager();
  const { id } = await params;
  const query = await searchParams;
  const formError = parseWarehouseFormError(query);
  const qtyInvalid = Boolean(formError?.fields.includes("quantityDone") || formError?.code === "qty");
  const loaded = await safeWarehouseCall(() => loadReceipt(id));
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const receipt = loaded.data;
  const canReceive = receipt.state !== "done" && receipt.state !== "cancel";

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse/receipts">All receipts</Link>
        <p className="sf-kicker">Receipt</p>
        <h1>{receipt.name}</h1>
        {query.received && <p className="sf-invoice-banner" role="status">Stock received.</p>}
        <FormErrorBanner error={formError} />

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table sf-delivery-meta">
            <tbody>
              <tr><th scope="row">Partner</th><td>{receipt.partner?.name || "—"}</td></tr>
              <tr><th scope="row">Purchase</th><td>{receipt.purchase?.name || "—"}</td></tr>
              <tr><th scope="row">Warehouse</th><td>{receipt.warehouse?.name || "—"}</td></tr>
              <tr><th scope="row">Status</th><td><span className="sf-badge">{pretty(receipt.state)}</span></td></tr>
              <tr><th scope="row">Kind</th><td>{receipt.isReturn ? "Customer return" : "Supplier receipt"}</td></tr>
              <tr><th scope="row">Scheduled</th><td>{receipt.scheduledDate ? String(receipt.scheduledDate).slice(0, 16) : "—"}</td></tr>
              <tr><th scope="row">Done</th><td>{receipt.dateDone ? String(receipt.dateDone).slice(0, 16) : "Not yet"}</td></tr>
            </tbody>
          </table>
        </div>

        <section className="sf-delivery-section">
          <h2>Moves</h2>
          {canReceive ? (
            <OnceForm action={receiveWarehouseReceiptAction}>
              <input type="hidden" name="pickingId" value={receipt.id} />
              <div className="sf-cart-table-wrap">
                <table className="sf-cart-table">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Destination</th>
                      <th scope="col" className="is-num">Ordered</th>
                      <th scope="col" className="is-num">Receive now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.lines.map((line) => (
                      <tr key={line.moveId}>
                        <th scope="row">
                          {line.product.name}
                          {line.product.defaultCode ? ` (${line.product.defaultCode})` : ""}
                          <input type="hidden" name="moveId" value={line.moveId} />
                        </th>
                        <td>{line.destinationLocation?.name || "—"}</td>
                        <td className="is-num">
                          {line.orderedQty}{line.uom ? ` ${line.uom.name}` : ""}
                        </td>
                        <td className={`is-num${qtyInvalid ? " is-invalid" : ""}`}>
                          <input
                            name="quantityDone"
                            type="number"
                            min="0"
                            step="any"
                            required
                            aria-invalid={qtyInvalid || undefined}
                            defaultValue={String(line.remainingQty > 0 ? line.remainingQty : line.orderedQty)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <OnceSubmit className="sf-btn" pendingLabel="Receiving…">
                <span>Receive stock</span>
              </OnceSubmit>
            </OnceForm>
          ) : (
            <div className="sf-cart-table-wrap">
              <table className="sf-cart-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Destination</th>
                    <th scope="col" className="is-num">Ordered</th>
                    <th scope="col" className="is-num">Received</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {receipt.backorders.length > 0 && (
          <section className="sf-delivery-section">
            <h2>Backorders</h2>
            <ul className="sf-linked-list">
              {receipt.backorders.map((row) => (
                <li key={row.id}>
                  <Link className="sf-text-link" href={`/account/warehouse/receipts/${row.id}`}>
                    {row.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </StorefrontShell>
  );
}
