import Link from "next/link";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { importWarehouseInventoryAction } from "../../../../../lib/actions/warehouse";
import { fieldClassName, parseWarehouseFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { getMyWarehouses } from "../../../../../lib/odoo/warehouse";
import { safeWarehouseCall } from "../../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function ImportWarehouseInventoryPage({
  searchParams,
}: {
  searchParams: Promise<FormErrorQuery>;
}) {
  await requireWarehouseManager();
  const query = await searchParams;
  const formError = parseWarehouseFormError(query);
  const loaded = await safeWarehouseCall(() => getMyWarehouses());
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const access = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse/inventory">All sessions</Link>
        <p className="sf-kicker">Inventory</p>
        <h1>Import count.</h1>
        <p className="muted">
          Upload CSV or XLSX with product code/barcode and counted quantity. Duplicate files are rejected.
        </p>
        <FormErrorBanner error={formError} />

        <OnceForm action={importWarehouseInventoryAction} className="sf-wh-form" encType="multipart/form-data">
          <div className="sf-biz-grid">
            <label className={fieldClassName("sf-biz-field", formError?.fields, "warehouseId")}>
              Warehouse
              <select
                name="warehouseId"
                required
                defaultValue={access.defaultWarehouseId ?? ""}
                aria-invalid={formError?.fields.includes("warehouseId") || undefined}
              >
                <option value="" disabled>Select warehouse</option>
                {access.warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </label>
            <label className="sf-biz-field">
              Session type
              <select name="sessionType" defaultValue="count">
                <option value="count">Stock count</option>
                <option value="opening">Opening balance</option>
              </select>
            </label>
            <label className={fieldClassName("sf-biz-field is-span-2", formError?.fields, "file")}>
              File
              <input
                name="file"
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                required
                aria-invalid={formError?.fields.includes("file") || undefined}
              />
            </label>
          </div>
          <OnceSubmit className="sf-btn" pendingLabel="Uploading…">
            <span>Upload &amp; preview</span>
          </OnceSubmit>
        </OnceForm>
      </main>
    </StorefrontShell>
  );
}
