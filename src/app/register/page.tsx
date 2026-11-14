import Link from "next/link";
import { BrandLogo } from "../../components/storefront/brand-logo";
import { OnceForm, OnceSubmit } from "../../components/storefront/once-submit";
import { RegisterKycFields } from "../../components/storefront/register-kyc-fields";
import { StorefrontShell } from "../../components/storefront/shell";
import { registerAction } from "../../lib/actions/auth";
import { BRAND } from "../../lib/brand";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorText = error === "exists"
    ? "An account with these details already exists."
    : error === "password"
      ? "Password must be at least 8 characters."
      : error === "role"
        ? "Choose merchant, buyer, distributor, or marketer."
        : error === "account"
          ? "Fill your name, email, and a password of at least 8 characters."
        : error === "kyc"
          ? "Fill the trade details for the account type you selected."
        : error === "image"
          ? "Upload a JPEG, PNG, GIF, or WebP shop photo under 5 MB."
        : error === "payment"
          ? "Choose how the shop will pay."
        : error === "unavailable"
          ? "The store service is temporarily unavailable. Please try again shortly."
          : null;

  return (
    <StorefrontShell>
      <main className="sf-auth-gate is-register">
        <div className="sf-auth-panel is-wide">
          <div className="sf-auth-brand">
            <BrandLogo href="/" variant="auth" priority />
            <p className="sf-auth-brand-name">{BRAND.name}</p>
            <p className="sf-auth-brand-ar">{BRAND.nameAr}</p>
          </div>

          <header className="sf-auth-intro">
            <p className="sf-kicker">Trade account</p>
            <h1>Create your account.</h1>
          </header>

          {errorText ? <p className="error sf-auth-error">{errorText}</p> : null}

          <OnceForm className="sf-business-form sf-auth-register-form" action={registerAction}>
            <div className="sf-biz-panel">
              <section className="sf-biz-block">
                <h2>Login</h2>
                <div className="sf-biz-grid">
                  <label className="sf-biz-field">Name<input name="name" required dir="auto" /></label>
                  <label className="sf-biz-field">Email<input name="email" type="email" required dir="auto" /></label>
                  <label className="sf-biz-field">Password<input name="password" type="password" minLength={8} required /></label>
                </div>
              </section>
              <RegisterKycFields />
              <div className="sf-biz-actions">
                <OnceSubmit className="sf-btn" pendingLabel="Submitting…">
                  <span>Submit for review</span>
                  <span className="sf-arrow" aria-hidden>→</span>
                </OnceSubmit>
              </div>
            </div>
          </OnceForm>

          <p className="sf-auth-switch">
            Already have an account? <Link className="sf-text-link" href="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </StorefrontShell>
  );
}
