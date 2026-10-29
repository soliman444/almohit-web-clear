import Link from "next/link";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { createBuyerProductAction } from "../../../../../lib/actions/buyer";
import { fieldClassName, parseBuyerFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import { listBuyerUoms } from "../../../../../lib/odoo/buyer";
import { safeApiCall } from "../../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function NewBuyerProductPage({
  searchParams,
}: {
  searchParams: Promise<FormErrorQuery>;
}) {
  await requireBuyer();
  const formError = parseBuyerFormError(await searchParams);
  const invalid = formError?.fields ?? [];
  const loaded = await safeApiCall(() => listBuyerUoms());
  if (!loaded.ok) return <StorefrontUnavailable />;
  const uoms = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer/products">Back to products</Link>
        <p className="sf-kicker">Buyer</p>
        <h1>New procurement product.</h1>
        <FormErrorBanner error={formError} />
        <OnceForm className="sf-auth-form" action={createBuyerProductAction} style={{ padding: 0 }}>
          <div className="sf-address-form">
            <label className={fieldClassName("sf-field is-wide", invalid, "name")}>
              Name
              <input name="name" required aria-invalid={invalid.includes("name")} />
            </label>
            <label className={fieldClassName("sf-field", invalid, "defaultCode")}>
              Internal code
              <input name="defaultCode" />
            </label>
            <label className={fieldClassName("sf-field", invalid, "barcode")}>
              Barcode
              <input name="barcode" />
            </label>
            <label className={fieldClassName("sf-field", invalid, "type")}>
              Type
              <select name="type" defaultValue="product">
                <option value="product">Storable</option>
                <option value="consu">Consumable</option>
                <option value="service">Service</option>
              </select>
            </label>
            <label className={fieldClassName("sf-field", invalid, "uomId")}>
              Unit of measure
              <select name="uomId" defaultValue="" aria-invalid={invalid.includes("uomId")}>
                <option value="">Default</option>
                {uoms.map((uom) => (
                  <option key={uom.id} value={uom.id}>
                    {uom.name}{uom.category ? ` · ${uom.category.name}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldClassName("sf-field is-wide", invalid, "purchaseDescription")}>
              Purchase notes
              <textarea name="purchaseDescription" rows={3} />
            </label>
            <label className={fieldClassName("sf-field is-wide", invalid, "image", "images")}>
              Image
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-invalid={invalid.includes("image")} />
            </label>
          </div>
          <OnceSubmit className="sf-btn" pendingLabel="Saving…"><span>Create product</span></OnceSubmit>
        </OnceForm>
      </main>
    </StorefrontShell>
  );
}
