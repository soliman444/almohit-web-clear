import Link from "next/link";
import { notFound } from "next/navigation";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { updateBuyerSupplierAction } from "../../../../../lib/actions/buyer";
import { fieldClassName, parseBuyerFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { ApiClientError } from "../../../../../lib/odoo/errors";
import { getBuyerSupplier } from "../../../../../lib/odoo/buyer";
import { parseOdooRecordId } from "../../../../../lib/odoo/catalog";
import { safeApiCall } from "../../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function BuyerSupplierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FormErrorQuery & { created?: string; updated?: string }>;
}) {
  await requireBuyer();
  const { id } = await params;
  const query = await searchParams;
  const formError = parseBuyerFormError(query);
  const invalid = formError?.fields ?? [];
  const loaded = await safeApiCall(() => loadSupplier(id));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const supplier = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer/suppliers">All suppliers</Link>
        <p className="sf-kicker">Supplier</p>
        <h1>{supplier.name}</h1>
        {query.created && <p className="sf-invoice-banner" role="status">Supplier created.</p>}
        {query.updated && <p className="sf-invoice-banner" role="status">Supplier updated.</p>}
        <FormErrorBanner error={formError} />

        <OnceForm className="sf-auth-form" action={updateBuyerSupplierAction} style={{ padding: 0 }}>
          <input type="hidden" name="id" value={supplier.id} />
          <div className="sf-address-form">
            <label className={fieldClassName("sf-field is-wide", invalid, "name")}>Name<input name="name" required defaultValue={supplier.name} aria-invalid={invalid.includes("name")} /></label>
            <label className={fieldClassName("sf-field", invalid, "phone")}>Phone<input name="phone" defaultValue={supplier.phone ?? ""} /></label>
            <label className={fieldClassName("sf-field", invalid, "mobile")}>Mobile<input name="mobile" defaultValue={supplier.mobile ?? ""} /></label>
            <label className={fieldClassName("sf-field", invalid, "email")}>Email<input name="email" type="email" defaultValue={supplier.email ?? ""} aria-invalid={invalid.includes("email")} /></label>
            <label className={fieldClassName("sf-field", invalid, "taxNumber")}>Tax number<input name="taxNumber" defaultValue={supplier.vat ?? ""} /></label>
            <label className={fieldClassName("sf-field is-wide", invalid, "street")}>Street<input name="street" defaultValue={supplier.street ?? ""} /></label>
            <label className={fieldClassName("sf-field is-wide", invalid, "street2")}>Street 2<input name="street2" defaultValue={supplier.street2 ?? ""} /></label>
            <label className={fieldClassName("sf-field", invalid, "city")}>City<input name="city" defaultValue={supplier.city ?? ""} /></label>
            <label className={fieldClassName("sf-field", invalid, "zip")}>Postal code<input name="zip" defaultValue={supplier.zip ?? ""} /></label>
            <label className={fieldClassName("sf-field is-wide", invalid, "notes")}>Notes<textarea name="notes" rows={3} defaultValue={supplier.comment ?? ""} /></label>
          </div>
          <OnceSubmit className="sf-btn" pendingLabel="Saving…"><span>Save supplier</span></OnceSubmit>
        </OnceForm>
      </main>
    </StorefrontShell>
  );
}

async function loadSupplier(id: string) {
  const supplierId = parseOdooRecordId(id);
  if (!supplierId) notFound();
  try {
    return await getBuyerSupplier(supplierId);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.code === "SUPPLIER_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}
