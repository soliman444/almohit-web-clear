import Link from "next/link";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import { listWarehouseIssues } from "../../../../lib/odoo/warehouse";
import { safeWarehouseCall } from "../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../lib/session/access";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export default async function WarehouseIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireWarehouseManager();
  const query = await searchParams;
  const status = query.status?.trim() || "pending";
  const loaded = await safeWarehouseCall(() => listWarehouseIssues({ status, pageSize: 50 }));
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const issues = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse">Warehouse desk</Link>
        <p className="sf-kicker">Issues</p>
        <h1>Sales issues.</h1>
        <p className="muted">Pick and dispatch outgoing stock for paid sales orders.</p>

        <div className="sf-wh-tabs" role="tablist" aria-label="Issue status">
          {[
            ["pending", "Pending"],
            ["dispatched", "Dispatched"],
            ["done", "Done"],
            ["all", "All"],
          ].map(([value, label]) => (
            <Link
              key={value}
              className={`sf-wh-tab${status === value ? " is-active" : ""}`}
              href={`/account/warehouse/issues?status=${value}`}
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
                <th scope="col">Issue</th>
                <th scope="col">Customer</th>
                <th scope="col">Sale</th>
                <th scope="col">Warehouse</th>
                <th scope="col">Dispatch</th>
                <th scope="col">Payment</th>
              </tr>
            </thead>
            <tbody>
              {issues.items.length === 0 ? (
                <tr><td colSpan={6} className="muted">No issues in this view.</td></tr>
              ) : issues.items.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    <Link className="sf-text-link" href={`/account/warehouse/issues/${row.id}`}>
                      {row.name}
                    </Link>
                  </th>
                  <td>{row.customer?.name || "—"}</td>
                  <td>{row.saleOrder?.name || row.origin || "—"}</td>
                  <td>{row.warehouse?.name || "—"}</td>
                  <td><span className="sf-badge">{pretty(row.dispatchState)}</span></td>
                  <td>{row.paymentOk ? "OK" : "Blocked"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </StorefrontShell>
  );
}
