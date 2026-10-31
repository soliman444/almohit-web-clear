import Link from "next/link";
import { StorefrontShell } from "../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../components/system/storefront-unavailable";
import { getWarehouseDashboard } from "../../../lib/odoo/warehouse";
import { safeWarehouseCall } from "../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function WarehouseHubPage() {
  await requireWarehouseManager();
  const loaded = await safeWarehouseCall(() => getWarehouseDashboard());
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned backHref="/account" />;
    }
    return <StorefrontUnavailable />;
  }
  const dash = loaded.data;

  const stats = [
    { label: "Warehouses", value: dash.warehouseCount },
    { label: "Products in stock", value: dash.productsInStock },
    { label: "Pending receipts", value: dash.pendingReceipts, href: "/account/warehouse/receipts" },
    { label: "Pending issues", value: dash.pendingIssues, href: "/account/warehouse/issues" },
    { label: "Incoming transfers", value: dash.incomingTransfers, href: "/account/warehouse/transfers?direction=incoming" },
    { label: "Outgoing transfers", value: dash.outgoingTransfers, href: "/account/warehouse/transfers?direction=outgoing" },
    { label: "Open variances", value: dash.stockVariances, href: "/account/warehouse/transfers" },
  ] as const;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account">Back to my account</Link>
        <p className="sf-kicker">Warehouse</p>
        <h1>Warehouse desk.</h1>
        <p className="muted">
          Receive inbound stock, dispatch sales issues, move between warehouses, and count inventory.
        </p>

        {dash.warehouses.length > 0 && (
          <p className="sf-wh-assigned">
            Assigned: {dash.warehouses.map((w) => w.name).join(" · ")}
          </p>
        )}

        <section className="sf-wh-stats" aria-label="Warehouse snapshot">
          {stats.map((stat) => {
            const body = (
              <>
                <span className="sf-wh-stat-value">{stat.value}</span>
                <span className="sf-wh-stat-label">{stat.label}</span>
              </>
            );
            return "href" in stat && stat.href ? (
              <Link key={stat.label} className="sf-wh-stat is-link" href={stat.href}>
                {body}
              </Link>
            ) : (
              <div key={stat.label} className="sf-wh-stat">
                {body}
              </div>
            );
          })}
        </section>

        <nav className="sf-wh-hub" aria-label="Warehouse sections">
          <Link className="sf-btn" href="/account/warehouse/stock">
            <span>On-hand stock</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
          <Link className="sf-btn" href="/account/warehouse/receipts">
            <span>Incoming receipts</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
          <Link className="sf-btn" href="/account/warehouse/issues">
            <span>Sales issues</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
          <Link className="sf-btn" href="/account/warehouse/transfers">
            <span>Inter-warehouse transfers</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
          <Link className="sf-btn" href="/account/warehouse/inventory">
            <span>Inventory counts</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
        </nav>
      </main>
    </StorefrontShell>
  );
}
