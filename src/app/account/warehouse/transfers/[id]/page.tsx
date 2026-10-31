import Link from "next/link";
import { notFound } from "next/navigation";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import {
  cancelWarehouseTransferAction,
  dispatchWarehouseTransferAction,
  receiveWarehouseTransferAction,
} from "../../../../../lib/actions/warehouse";
import { parseWarehouseFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { ApiClientError } from "../../../../../lib/odoo/errors";
import { getWarehouseTransfer } from "../../../../../lib/odoo/warehouse";
import { parseOdooRecordId } from "../../../../../lib/odoo/catalog";
import { safeWarehouseCall } from "../../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

async function loadTransfer(id: string) {
  const recordId = parseOdooRecordId(id);
  if (!recordId) notFound();
  try {
    return await getWarehouseTransfer(recordId);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.code === "TRANSFER_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}

export default async function WarehouseTransferDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FormErrorQuery & {
    created?: string;
    dispatched?: string;
    received?: string;
    cancelled?: string;
  }>;
}) {
  await requireWarehouseManager();
  const { id } = await params;
  const query = await searchParams;
  const formError = parseWarehouseFormError(query);
  const qtyInvalid = Boolean(formError?.fields.includes("quantity") || formError?.code === "qty");
  const loaded = await safeWarehouseCall(() => loadTransfer(id));
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const transfer = loaded.data;
  const canDispatch = transfer.state === "requested";
  const canReceive = ["dispatched", "partially_received", "discrepancy"].includes(transfer.state);
  const canCancel = transfer.state === "requested";

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse/transfers">All transfers</Link>
        <p className="sf-kicker">Transfer</p>
        <h1>{transfer.name}</h1>
        {query.created && <p className="sf-invoice-banner" role="status">Transfer requested.</p>}
        {query.dispatched && <p className="sf-invoice-banner" role="status">Transfer dispatched.</p>}
        {query.received && <p className="sf-invoice-banner" role="status">Receive recorded.</p>}
        {query.cancelled && <p className="sf-invoice-banner" role="status">Transfer cancelled.</p>}
        <FormErrorBanner error={formError} />

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table sf-delivery-meta">
            <tbody>
              <tr><th scope="row">From</th><td>{transfer.sourceWarehouse?.name || "—"}</td></tr>
              <tr><th scope="row">To</th><td>{transfer.destWarehouse?.name || "—"}</td></tr>
              <tr><th scope="row">Status</th><td><span className="sf-badge">{pretty(transfer.state)}</span></td></tr>
              <tr><th scope="row">Requested by</th><td>{transfer.requestedBy?.name || "—"}</td></tr>
              <tr><th scope="row">Note</th><td>{transfer.note || "—"}</td></tr>
            </tbody>
          </table>
        </div>

        <section className="sf-delivery-section">
          <h2>Lines</h2>
          {(canDispatch || canReceive) ? (
            <OnceForm action={canDispatch ? dispatchWarehouseTransferAction : receiveWarehouseTransferAction}>
              <input type="hidden" name="transferId" value={transfer.id} />
              <div className="sf-cart-table-wrap">
                <table className="sf-cart-table">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col" className="is-num">Requested</th>
                      <th scope="col" className="is-num">Dispatched</th>
                      <th scope="col" className="is-num">Received</th>
                      <th scope="col" className="is-num">
                        {canDispatch ? "Dispatch qty" : "Receive qty"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfer.lines.map((line) => {
                      const remaining = Math.max(line.qtyDispatched - line.qtyReceived, 0);
                      const defaultQty = canDispatch
                        ? line.qtyRequested
                        : remaining;
                      return (
                        <tr key={line.id}>
                          <th scope="row">
                            {line.product.name}
                            {line.product.defaultCode ? ` (${line.product.defaultCode})` : ""}
                            <input type="hidden" name="lineId" value={line.id} />
                          </th>
                          <td className="is-num">{line.qtyRequested}{line.uom ? ` ${line.uom.name}` : ""}</td>
                          <td className="is-num">{line.qtyDispatched}</td>
                          <td className="is-num">{line.qtyReceived}</td>
                          <td className={`is-num${qtyInvalid ? " is-invalid" : ""}`}>
                            <input
                              name="quantity"
                              type="number"
                              min="0"
                              step="any"
                              required={canReceive}
                              aria-invalid={qtyInvalid || undefined}
                              defaultValue={String(defaultQty)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <OnceSubmit className="sf-btn" pendingLabel={canDispatch ? "Dispatching…" : "Receiving…"}>
                <span>{canDispatch ? "Dispatch transfer" : "Receive transfer"}</span>
              </OnceSubmit>
            </OnceForm>
          ) : (
            <div className="sf-cart-table-wrap">
              <table className="sf-cart-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col" className="is-num">Requested</th>
                    <th scope="col" className="is-num">Dispatched</th>
                    <th scope="col" className="is-num">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.lines.map((line) => (
                    <tr key={line.id}>
                      <th scope="row">{line.product.name}</th>
                      <td className="is-num">{line.qtyRequested}{line.uom ? ` ${line.uom.name}` : ""}</td>
                      <td className="is-num">{line.qtyDispatched}</td>
                      <td className="is-num">{line.qtyReceived}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {transfer.discrepancies.length > 0 && (
          <section className="sf-delivery-section">
            <h2>Discrepancies</h2>
            <div className="sf-cart-table-wrap">
              <table className="sf-cart-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col" className="is-num">Expected</th>
                    <th scope="col" className="is-num">Received</th>
                    <th scope="col" className="is-num">Diff</th>
                    <th scope="col">Reason</th>
                    <th scope="col">State</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.discrepancies.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">{row.product?.name || "—"}</th>
                      <td className="is-num">{row.qtyExpected}</td>
                      <td className="is-num">{row.qtyReceived}</td>
                      <td className="is-num">{row.qtyDifference}</td>
                      <td>{pretty(row.reason)}</td>
                      <td><span className="sf-badge">{pretty(row.state)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {canCancel && (
          <OnceForm action={cancelWarehouseTransferAction}>
            <input type="hidden" name="transferId" value={transfer.id} />
            <OnceSubmit className="sf-btn is-subtle" pendingLabel="Cancelling…">
              <span>Cancel transfer</span>
            </OnceSubmit>
          </OnceForm>
        )}
      </main>
    </StorefrontShell>
  );
}
