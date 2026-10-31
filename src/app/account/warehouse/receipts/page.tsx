import Link from "next/link";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import { listWarehouseReceipts } from "../../../../lib/odoo/warehouse";
import { safeWarehouseCall } from "../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export default async function WarehouseReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireWarehouseManager();
  const query = await searchParams;
  const status = query.status?.trim() || "pending";
  const loaded = await safeWarehouseCall(() => listWarehouseReceipts({ status, pageSize: 50 }));
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const receipts = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse">Warehouse desk</Link>
        <p className="sf-kicker">Receipts</p>
        <h1>Incoming receipts.</h1>
        <p className="muted">Purchase receipts and customer returns into your warehouses.</p>

        <div className="sf-wh-tabs" role="tablist" aria-label="Receipt status">
          {[
            ["pending", "Pending"],
            ["ready", "Ready"],
            ["done", "Done"],
            ["cancel", "Cancelled"],
          ].map(([value, label]) => (
            <Link
              key={value}
              className={`sf-wh-tab${status === value ? " is-active" : ""}`}
              href={`/account/warehouse/receipts?status=${value}`}
              aria-current={status === value ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table">
            <thead>
              <tr>
                <th scope="col">Receipt</th>
                <th scope="col">Partner</th>
                <th scope="col">Warehouse</th>
                <th scope="col">Status</th>
                <th scope="col">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {receipts.items.length === 0 ? (
                <tr><td colSpan={5} className="muted">No receipts in this view.</td></tr>
              ) : receipts.items.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    <Link className="sf-text-link" href={`/account/warehouse/receipts/${row.id}`}>
                      {row.name}
                    </Link>
                    {row.isReturn ? <span className="sf-badge">Return</span> : null}
                  </th>
                  <td>{row.partner?.name || "—"}</td>
                  <td>{row.warehouse?.name || "—"}</td>
                  <td><span className="sf-badge">{pretty(row.state)}</span></td>
                  <td>{row.scheduledDate ? String(row.scheduledDate).slice(0, 16) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </StorefrontShell>
  );
}
