import Link from "next/link";
import { redirect } from "next/navigation";
import { FormErrorBanner } from "../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../components/storefront/shell";
import { TradeKycFields } from "../../../components/storefront/trade-kyc-fields";
import { submitBusinessRequestAction } from "../../../lib/actions/auth";
import { parseAppRole } from "../../../lib/trade-kyc";
import { StorefrontUnavailable } from "../../../components/system/storefront-unavailable";
import { getCurrentCustomer, getCurrentCustomerSession } from "../../../lib/session/customer";
import { safeApiCall } from "../../../lib/odoo/safe";
import { parseTradeFormError, type FormErrorQuery } from "../../../lib/form-errors";
import { hasOdooSession } from "../../../lib/odoo/auth";
import { getTradeApplication } from "../../../lib/odoo/trade";

export default async function BusinessPage({
  searchParams,
}: {
  searchParams: Promise<FormErrorQuery>;
}) {
  const query = await searchParams;
  const formError = parseTradeFormError(query);
  const odooSession = await hasOdooSession();
  if (!odooSession) redirect("/login");
  const loaded = await safeApiCall(async () => {
    const me = await getCurrentCustomerSession();
    if (!me.authenticated) return null;
    const customer = await getCurrentCustomer();
    const application = await getTradeApplication();
    return { me, customer, application };
  });
  if (!loaded.ok) return <StorefrontUnavailable />;
  if (!loaded.data) redirect("/login");
  const { customer, application } = loaded.data;
  if (!customer) {
    return <StorefrontShell><main className="sf-account"><p>This account is not a customer account.</p></main></StorefrontShell>;
  }

  const requestStatus = application?.status ?? null;
  const rejectionReason = application?.rejectionReason;
  const locked = customer.state === "approved" || customer.state === "pending"
    || requestStatus === "approved" || requestStatus === "pending";
  const defaultBusinessName = application?.companyName ?? customer.businessName ?? "";
  const role = parseAppRole(customer.role);
  const copy = role === "buyer"
    ? {
      kicker: "Buyer",
      title: "Buyer account",
      intro: locked
        ? "Office details are locked after submission. Changes are made in Odoo."
        : "Office details for wholesale approval. Review happens in Odoo.",
      submit: "Submit buyer request",
      kyc: "Fill registration, address, contact, and what you source.",
    }
    : role === "distributor"
      ? {
        kicker: "Distributor",
        title: "Distributor account",
        intro: locked
          ? "Fleet and coverage details are locked after submission. Changes are made in Odoo."
          : "Fleet and coverage details for wholesale approval. Review happens in Odoo.",
        submit: "Submit distributor request",
        kyc: "Fill registration, depot address, contact, and coverage area.",
      }
      : role === "marketer"
      ? {
        kicker: "Marketer",
        title: "Marketer account",
        intro: locked
          ? "Coverage details are locked after submission. Changes are made in Odoo."
          : "Coverage details so you can enroll shop merchants. Review happens in Odoo.",
        submit: "Submit marketer request",
        kyc: "Fill your name, coverage area, city, contact, and base address.",
      }
      : role === "warehouse_manager"
      ? {
        kicker: "Warehouse",
        title: "Warehouse manager account",
        intro: locked
          ? "Contact details are locked after submission. Warehouse assignment is managed in Odoo."
          : "Phone is required for warehouse approval. Warehouses are assigned after review in Odoo.",
        submit: "Submit warehouse request",
        kyc: "Provide a reachable phone number. Display name and city are optional.",
      }
      : {
        kicker: "Merchant",
        title: "Merchant account",
        intro: locked
          ? "Shop, people, and payment details are locked after submission. Changes are made in Odoo."
          : "Shop, people, and payment details for wholesale approval. Review happens in Odoo.",
        submit: "Submit merchant request",
        kyc: "Fill registration, address, manager, bank account, and payment method.",
      };
  const statusClass = requestStatus === "approved"
    ? "is-approved"
    : requestStatus === "pending"
      ? "is-pending"
      : requestStatus === "rejected"
        ? "is-rejected"
        : "";
  const kycDefaults = {
    businessName: defaultBusinessName,
    taxNumber: application?.taxNumber ?? "",
    businessType: application?.businessType ?? "",
    phone: application?.phone ?? customer.phone ?? "",
    city: application?.city ?? "",
    address: application?.street ?? "",
    managerName: application?.managerName ?? "",
    employeeName: application?.employeeName ?? "",
    bankAccount: application?.bankAccount ?? "",
    paymentMethod: application?.paymentMethod ?? "",
    notes: application?.notes ?? "",
    shopImageUrl: application?.shopImageUrl,
  };

  return (
    <StorefrontShell>
      <main className="sf-business-page">
        <header className="sf-biz-hero">
          <div className="sf-biz-hero-top">
            <Link className="sf-biz-back" href="/account">Back to my account</Link>
            {requestStatus && (
              <p className={`sf-biz-status ${statusClass}`}>
                {requestStatus.charAt(0).toUpperCase() + requestStatus.slice(1)}{rejectionReason ? ` — ${rejectionReason}` : ""}
              </p>
            )}
          </div>
          <div className="sf-biz-hero-copy">
            <p className="sf-kicker">{copy.kicker}</p>
            <h1>{copy.title}</h1>
            <p className="sf-count">{copy.intro}</p>
          </div>
        </header>
        <div className="sf-biz-error">
          <FormErrorBanner
            error={formError
              ? {
                  ...formError,
                  message: formError.code === "kyc" && !query.detail ? copy.kyc : formError.message,
                }
              : null}
          />
        </div>
        {locked ? (
          <div className="sf-biz-panel">
            <TradeKycFields role={role} readOnly defaults={kycDefaults} />
          </div>
        ) : (
          <OnceForm className="sf-business-form" action={submitBusinessRequestAction}>
            <div className="sf-biz-panel">
              <TradeKycFields role={role} defaults={kycDefaults} invalidFields={formError?.fields ?? []} />
              <div className="sf-biz-actions">
                <OnceSubmit className="sf-btn" pendingLabel="Submitting…">
                  <span>{copy.submit}</span>
                </OnceSubmit>
              </div>
            </div>
          </OnceForm>
        )}
      </main>
    </StorefrontShell>
  );
}
