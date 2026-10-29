import Link from "next/link";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { createBuyerSupplierAction } from "../../../../../lib/actions/buyer";
import { fieldClassName, parseBuyerFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { requireBuyer } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function NewBuyerSupplierPage({
  searchParams,
}: {
  searchParams: Promise<FormErrorQuery>;
}) {
  await requireBuyer();
  const formError = parseBuyerFormError(await searchParams);
  const invalid = formError?.fields ?? [];

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer/suppliers">Back to suppliers</Link>
        <p className="sf-kicker">Buyer</p>
        <h1>New supplier.</h1>
        <FormErrorBanner error={formError} />
        <OnceForm className="sf-auth-form" action={createBuyerSupplierAction} style={{ padding: 0 }}>
          <div className="sf-address-form">
            <label className={fieldClassName("sf-field is-wide", invalid, "name")}>Name<input name="name" required aria-invalid={invalid.includes("name")} /></label>
            <label className={fieldClassName("sf-field", invalid, "phone")}>Phone<input name="phone" /></label>
            <label className={fieldClassName("sf-field", invalid, "mobile")}>Mobile<input name="mobile" /></label>
            <label className={fieldClassName("sf-field", invalid, "email")}>Email<input name="email" type="email" aria-invalid={invalid.includes("email")} /></label>
            <label className={fieldClassName("sf-field", invalid, "taxNumber")}>Tax number<input name="taxNumber" /></label>
            <label className={fieldClassName("sf-field is-wide", invalid, "street")}>Street<input name="street" /></label>
            <label className={fieldClassName("sf-field is-wide", invalid, "street2")}>Street 2<input name="street2" /></label>
            <label className={fieldClassName("sf-field", invalid, "city")}>City<input name="city" /></label>
            <label className={fieldClassName("sf-field", invalid, "zip")}>Postal code<input name="zip" /></label>
            <label className={fieldClassName("sf-field is-wide", invalid, "notes")}>Notes<textarea name="notes" rows={3} /></label>
          </div>
          <OnceSubmit className="sf-btn" pendingLabel="Saving…"><span>Create supplier</span></OnceSubmit>
        </OnceForm>
      </main>
    </StorefrontShell>
  );
}
