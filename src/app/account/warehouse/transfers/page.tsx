import Link from "next/link";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import { listWarehouseTransfers } from "../../../../lib/odoo/warehouse";
import { safeWarehouseCall } from "../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export default async function WarehouseTransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string; status?: string }>;
}) {
  await requireWarehouseManager();
  const query = await searchParams;
  const direction = query.direction?.trim() || "all";
  const status = query.status?.trim() || undefined;
  const loaded = await safeWarehouseCall(() =>
    listWarehouseTransfers({ direction, status, pageSize: 50 }),
  );
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const transfers = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse">Warehouse desk</Link>
        <p className="sf-kicker">Transfers</p>
        <h1>Inter-warehouse transfers.</h1>
        <p className="muted">Request, dispatch, and receive stock between warehouses.</p>

        <div className="sf-wh-toolbar">
          <div className="sf-wh-tabs" role="tablist" aria-label="Transfer direction">
            {[
              ["all", "All"],
              ["incoming", "Incoming"],
              ["outgoing", "Outgoing"],
            ].map(([value, label]) => (
              <Link
                key={value}
                className={`sf-wh-tab${direction === value ? " is-active" : ""}`}
                href={`/account/warehouse/transfers?direction=${value}${status ? `&status=${status}` : ""}`}
                aria-current={direction === value ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
          <Link className="sf-btn" href="/account/warehouse/transfers/new">
            <span>New transfer</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
        </div>

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table">
            <thead>
              <tr>
                <th scope="col">Transfer</th>
                <th scope="col">From</th>
                <th scope="col">To</th>
                <th scope="col">Status</th>
                <th scope="col" className="is-num">Variances</th>
                <th scope="col">Requested</th>
              </tr>
            </thead>
            <tbody>
              {transfers.items.length === 0 ? (
                <tr><td colSpan={6} className="muted">No transfers in this view.</td></tr>
              ) : transfers.items.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    <Link className="sf-text-link" href={`/account/warehouse/transfers/${row.id}`}>
                      {row.name}
                    </Link>
                  </th>
                  <td>{row.sourceWarehouse?.name || "—"}</td>
                  <td>{row.destWarehouse?.name || "—"}</td>
                  <td><span className="sf-badge">{pretty(row.state)}</span></td>
                  <td className="is-num">{row.openDiscrepancies || "—"}</td>
                  <td>{row.requestedAt ? String(row.requestedAt).slice(0, 16) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </StorefrontShell>
  );
}
