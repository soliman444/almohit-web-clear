import Link from "next/link";
import { notFound } from "next/navigation";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { approveWarehouseInventoryAction } from "../../../../../lib/actions/warehouse";
import { parseWarehouseFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { ApiClientError } from "../../../../../lib/odoo/errors";
import { getWarehouseInventory } from "../../../../../lib/odoo/warehouse";
import { parseOdooRecordId } from "../../../../../lib/odoo/catalog";
import { safeWarehouseCall } from "../../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

async function loadSession(id: string) {
  const recordId = parseOdooRecordId(id);
  if (!recordId) notFound();
  try {
    return await getWarehouseInventory(recordId);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.code === "INVENTORY_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}

export default async function WarehouseInventoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FormErrorQuery & { imported?: string; approved?: string }>;
}) {
  await requireWarehouseManager();
  const { id } = await params;
  const query = await searchParams;
  const formError = parseWarehouseFormError(query);
  const loaded = await safeWarehouseCall(() => loadSession(id));
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const session = loaded.data;
  const canApprove = session.state === "draft";

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse/inventory">All sessions</Link>
        <p className="sf-kicker">Inventory</p>
        <h1>{session.name}</h1>
        {query.imported && <p className="sf-invoice-banner" role="status">Import preview ready. Review then approve.</p>}
        {query.approved && <p className="sf-invoice-banner" role="status">Inventory adjustments applied.</p>}
        <FormErrorBanner error={formError} />

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table sf-delivery-meta">
            <tbody>
              <tr><th scope="row">Warehouse</th><td>{session.warehouse?.name || "—"}</td></tr>
              <tr><th scope="row">Location</th><td>{session.location?.name || "—"}</td></tr>
              <tr><th scope="row">Type</th><td>{pretty(session.sessionType)}</td></tr>
              <tr><th scope="row">Status</th><td><span className="sf-badge">{pretty(session.state)}</span></td></tr>
              <tr><th scope="row">File</th><td>{session.sourceFilename || "—"}</td></tr>
              <tr><th scope="row">Created by</th><td>{session.createdBy?.name || "—"}</td></tr>
              <tr><th scope="row">Approved</th><td>{session.approvedAt ? String(session.approvedAt).slice(0, 16) : "—"}</td></tr>
            </tbody>
          </table>
        </div>

        <section className="sf-delivery-section">
          <h2>Lines</h2>
          <div className="sf-cart-table-wrap">
            <table className="sf-cart-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Product</th>
                  <th scope="col" className="is-num">On hand</th>
                  <th scope="col" className="is-num">Counted</th>
                  <th scope="col" className="is-num">Diff</th>
                </tr>
              </thead>
              <tbody>
                {session.lines.length === 0 ? (
                  <tr><td colSpan={5} className="muted">No lines.</td></tr>
                ) : session.lines.map((line) => (
                  <tr key={line.id} className={line.qtyDifference !== 0 ? "sf-wh-diff" : undefined}>
                    <td>{line.rowNumber}</td>
                    <th scope="row">
                      {line.product.name}
                      {line.product.defaultCode ? (
                        <span className="sf-wh-code"> · {line.product.defaultCode}</span>
                      ) : null}
                    </th>
                    <td className="is-num">{line.qtyOnHand}{line.uom ? ` ${line.uom.name}` : ""}</td>
                    <td className="is-num">{line.qtyCounted}</td>
                    <td className="is-num">{line.qtyDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {canApprove && (
          <OnceForm action={approveWarehouseInventoryAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            <OnceSubmit className="sf-btn" pendingLabel="Approving…">
              <span>Approve adjustments</span>
            </OnceSubmit>
          </OnceForm>
        )}
      </main>
    </StorefrontShell>
  );
}
