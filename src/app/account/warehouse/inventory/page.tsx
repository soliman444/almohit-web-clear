import Link from "next/link";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import { listWarehouseInventory } from "../../../../lib/odoo/warehouse";
import { safeWarehouseCall } from "../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export default async function WarehouseInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireWarehouseManager();
  const query = await searchParams;
  const status = query.status?.trim() || undefined;
  const loaded = await safeWarehouseCall(() => listWarehouseInventory({ status, pageSize: 50 }));
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const sessions = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse">Warehouse desk</Link>
        <p className="sf-kicker">Inventory</p>
        <h1>Inventory counts.</h1>
        <p className="muted">Import CSV/XLSX counts, review differences, then approve adjustments.</p>

        <div className="sf-wh-toolbar">
          <div className="sf-wh-tabs" role="tablist" aria-label="Session status">
            {[
              ["", "All"],
              ["draft", "Draft"],
              ["approved", "Approved"],
              ["cancelled", "Cancelled"],
            ].map(([value, label]) => (
              <Link
                key={label}
                className={`sf-wh-tab${(status || "") === value ? " is-active" : ""}`}
                href={value ? `/account/warehouse/inventory?status=${value}` : "/account/warehouse/inventory"}
                aria-current={(status || "") === value ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
          <Link className="sf-btn" href="/account/warehouse/inventory/import">
            <span>Import count</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
        </div>

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table">
            <thead>
              <tr>
                <th scope="col">Session</th>
                <th scope="col">Warehouse</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
                <th scope="col" className="is-num">Lines</th>
                <th scope="col">File</th>
              </tr>
            </thead>
            <tbody>
              {sessions.items.length === 0 ? (
                <tr><td colSpan={6} className="muted">No inventory sessions yet.</td></tr>
              ) : sessions.items.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    <Link className="sf-text-link" href={`/account/warehouse/inventory/${row.id}`}>
                      {row.name}
                    </Link>
                  </th>
                  <td>{row.warehouse?.name || "—"}</td>
                  <td>{pretty(row.sessionType)}</td>
                  <td><span className="sf-badge">{pretty(row.state)}</span></td>
                  <td className="is-num">{row.lineCount}</td>
                  <td>{row.sourceFilename || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </StorefrontShell>
  );
}
