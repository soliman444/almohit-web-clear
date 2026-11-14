import Link from "next/link";

export function WarehouseUnassigned({
  backHref = "/account",
}: {
  backHref?: string;
}) {
  return (
    <main className="sf-account sf-invoice-page sf-wh-page sf-desk-page">
      {backHref !== "/account" ? (
        <Link className="sf-text-link" href={backHref}>
          Warehouse desk
        </Link>
      ) : null}
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
      </div>
    </main>
  );
}
