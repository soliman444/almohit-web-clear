import Link from "next/link";
import { notFound } from "next/navigation";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { dispatchWarehouseIssueAction } from "../../../../../lib/actions/warehouse";
import { parseWarehouseFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { ApiClientError } from "../../../../../lib/odoo/errors";
import { getWarehouseIssue } from "../../../../../lib/odoo/warehouse";
import { parseOdooRecordId } from "../../../../../lib/odoo/catalog";
import { safeWarehouseCall } from "../../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

async function loadIssue(id: string) {
  const recordId = parseOdooRecordId(id);
  if (!recordId) notFound();
  try {
    return await getWarehouseIssue(recordId);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.code === "ISSUE_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}

export default async function WarehouseIssueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FormErrorQuery & { dispatched?: string }>;
}) {
  await requireWarehouseManager();
  const { id } = await params;
  const query = await searchParams;
  const formError = parseWarehouseFormError(query);
  const qtyInvalid = Boolean(formError?.fields.includes("quantityDone") || formError?.code === "qty");
  const loaded = await safeWarehouseCall(() => loadIssue(id));
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const issue = loaded.data;
  const canDispatch =
    issue.dispatchState === "pending"
    && issue.state !== "done"
    && issue.state !== "cancel"
    && issue.paymentOk;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse/issues">All issues</Link>
        <p className="sf-kicker">Issue</p>
        <h1>{issue.name}</h1>
        {query.dispatched && <p className="sf-invoice-banner" role="status">Dispatched to distributor.</p>}
        {!issue.paymentOk && (
          <p className="sf-invoice-banner sf-wh-banner-warn" role="status">
            Payment is not cleared yet — dispatch stays blocked.
          </p>
        )}
        <FormErrorBanner error={formError} />

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table sf-delivery-meta">
            <tbody>
              <tr><th scope="row">Customer</th><td>{issue.customer?.name || "—"}</td></tr>
              <tr><th scope="row">Sale order</th><td>{issue.saleOrder?.name || issue.origin || "—"}</td></tr>
              <tr><th scope="row">Warehouse</th><td>{issue.warehouse?.name || "—"}</td></tr>
              <tr><th scope="row">Picking</th><td><span className="sf-badge">{pretty(issue.state)}</span></td></tr>
              <tr><th scope="row">Dispatch</th><td><span className="sf-badge">{pretty(issue.dispatchState)}</span></td></tr>
              <tr><th scope="row">Scheduled</th><td>{issue.scheduledDate ? String(issue.scheduledDate).slice(0, 16) : "—"}</td></tr>
            </tbody>
          </table>
        </div>

        <section className="sf-delivery-section">
          <h2>Moves</h2>
          {canDispatch ? (
            <OnceForm action={dispatchWarehouseIssueAction}>
              <input type="hidden" name="pickingId" value={issue.id} />
              <div className="sf-cart-table-wrap">
                <table className="sf-cart-table">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Source</th>
                      <th scope="col" className="is-num">Ordered</th>
                      <th scope="col" className="is-num">Reserved</th>
                      <th scope="col" className="is-num">Dispatch now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issue.lines.map((line) => (
                      <tr key={line.moveId}>
                        <th scope="row">
                          {line.product.name}
                          {line.product.defaultCode ? ` (${line.product.defaultCode})` : ""}
                          <input type="hidden" name="moveId" value={line.moveId} />
                        </th>
                        <td>{line.sourceLocation?.name || "—"}</td>
                        <td className="is-num">
                          {line.orderedQty}{line.uom ? ` ${line.uom.name}` : ""}
                        </td>
                        <td className="is-num">{line.reservedQty}</td>
                        <td className={`is-num${qtyInvalid ? " is-invalid" : ""}`}>
                          <input
                            name="quantityDone"
                            type="number"
                            min="0"
                            step="any"
                            required
                            aria-invalid={qtyInvalid || undefined}
                            defaultValue={String(
                              line.remainingQty > 0
                                ? line.remainingQty
                                : line.orderedQty,
                            )}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <OnceSubmit className="sf-btn" pendingLabel="Dispatching…">
                <span>Dispatch to distributor</span>
              </OnceSubmit>
            </OnceForm>
          ) : (
            <div className="sf-cart-table-wrap">
              <table className="sf-cart-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Source</th>
                    <th scope="col" className="is-num">Ordered</th>
                    <th scope="col" className="is-num">Done</th>
                  </tr>
                </thead>
                <tbody>
                  {issue.lines.map((line) => (
                    <tr key={line.moveId}>
                      <th scope="row">{line.product.name}</th>
                      <td>{line.sourceLocation?.name || "—"}</td>
                      <td className="is-num">
                        {line.orderedQty}{line.uom ? ` ${line.uom.name}` : ""}
                      </td>
                      <td className="is-num">
                        {line.doneQty}{line.uom ? ` ${line.uom.name}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </StorefrontShell>
  );
}
