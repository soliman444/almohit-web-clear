import Link from "next/link";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { WarehouseTransferLines } from "../../../../../components/storefront/warehouse-transfer-lines";
import { WarehouseUnassigned } from "../../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { createWarehouseTransferAction } from "../../../../../lib/actions/warehouse";
import { fieldClassName, parseWarehouseFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { getMyWarehouses } from "../../../../../lib/odoo/warehouse";
import { safeWarehouseCall } from "../../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function NewWarehouseTransferPage({
  searchParams,
}: {
  searchParams: Promise<FormErrorQuery>;
}) {
  await requireWarehouseManager();
  const query = await searchParams;
  const formError = parseWarehouseFormError(query);
  const linesInvalid = Boolean(
    formError?.fields.some((f) => ["lines", "productId", "lineQuantity"].includes(f))
    || formError?.code === "lines",
  );
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
        <Link className="sf-text-link" href="/account/warehouse/transfers">All transfers</Link>
        <p className="sf-kicker">Transfer</p>
        <h1>Request transfer.</h1>
        <p className="muted">
          Source must be one of your warehouses. Destination can be any company warehouse.
        </p>
        <FormErrorBanner error={formError} />

        <OnceForm action={createWarehouseTransferAction} className="sf-wh-form">
          <div className="sf-biz-grid">
            <label className={fieldClassName("sf-biz-field", formError?.fields, "sourceWarehouseId")}>
              Source warehouse
              <select
                name="sourceWarehouseId"
                required
                defaultValue={access.defaultWarehouseId ?? ""}
                aria-invalid={formError?.fields.includes("sourceWarehouseId") || undefined}
              >
                <option value="" disabled>Select source</option>
                {access.warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </label>
            <label className={fieldClassName("sf-biz-field", formError?.fields, "destWarehouseId")}>
              Destination warehouse ID
              <input
                name="destWarehouseId"
                type="number"
                min="1"
                step="1"
                required
                placeholder="Numeric warehouse id"
                aria-invalid={formError?.fields.includes("destWarehouseId") || undefined}
              />
            </label>
            <label className="sf-biz-field is-span-2">
              Note
              <textarea name="note" rows={3} placeholder="Optional handoff note" />
            </label>
          </div>

          <h2>Lines</h2>
          <WarehouseTransferLines invalid={linesInvalid} />

          <OnceSubmit className="sf-btn" pendingLabel="Creating…">
            <span>Create transfer</span>
          </OnceSubmit>
        </OnceForm>
      </main>
    </StorefrontShell>
  );
}
