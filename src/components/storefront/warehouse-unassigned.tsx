import Link from "next/link";
import { StorefrontShell } from "./shell";

export function WarehouseUnassigned({
  backHref = "/account",
}: {
  backHref?: string;
}) {
  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href={backHref}>
          {backHref === "/account" ? "Back to my account" : "Warehouse desk"}
        </Link>
        <p className="sf-kicker">Warehouse</p>
        <h1>No warehouse assigned.</h1>
        <p className="muted">
          Your warehouse manager account is approved, but no warehouses are linked yet.
          Ask an admin to assign warehouses in Odoo, then refresh this page.
        </p>
        <div className="sf-wh-hub">
          <Link className="sf-btn is-subtle" href="/account/business">
            <span>Trade account</span>
          </Link>
          <Link className="sf-btn is-subtle" href="/account">
            <span>My account</span>
          </Link>
        </div>
      </main>
    </StorefrontShell>
  );
}
