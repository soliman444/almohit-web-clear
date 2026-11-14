import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "../../components/storefront/brand-logo";
import { OnceForm, OnceSubmit } from "../../components/storefront/once-submit";
import { StorefrontShell } from "../../components/storefront/shell";
import { loginAction } from "../../lib/actions/auth";
import { BRAND } from "../../lib/brand";
import { hasOdooSession } from "../../lib/odoo/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasOdooSession()) redirect("/");

  const { error } = await searchParams;
  return (
    <StorefrontShell>
      <main className="sf-auth-gate">
        <div className="sf-auth-panel">
          <div className="sf-auth-brand">
            <BrandLogo href="/" variant="auth" priority />
            <p className="sf-auth-brand-name">{BRAND.name}</p>
            <p className="sf-auth-brand-ar">{BRAND.nameAr}</p>
          </div>

          <OnceForm className="sf-auth-form is-gate" action={loginAction}>
            <p className="sf-kicker">Sign in</p>
            <h1>Welcome back.</h1>
            {error === "invalid" && <p className="error">Email or password is incorrect.</p>}
            {error === "unavailable" && (
              <p className="error">The store service is temporarily unavailable. Please try again shortly.</p>
            )}
            <label className="sf-field">
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label className="sf-field">
              Password
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <OnceSubmit className="sf-btn" pendingLabel="Signing in…">
              <span>Sign in</span>
              <span className="sf-arrow" aria-hidden>→</span>
            </OnceSubmit>
            <p className="sf-auth-switch">
              No account yet? <Link className="sf-text-link" href="/register">Create account</Link>
            </p>
          </OnceForm>
        </div>
      </main>
    </StorefrontShell>
  );
}
