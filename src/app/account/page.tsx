import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountDashboard } from "../../components/storefront/account-dashboard";
import { StorefrontShell } from "../../components/storefront/shell";
import { StorefrontUnavailable } from "../../components/system/storefront-unavailable";
import { logoutAction } from "../../lib/actions/auth";
import {
  accountDashboardLinks,
  asAccountRole,
  labelAccountRole,
  labelTradeStatus,
  usesAccountDesk,
} from "../../lib/account/role-nav";
import { safeApiCall } from "../../lib/odoo/safe";
import { redirectIfStaff } from "../../lib/session/access";

export default async function AccountPage() {
  await redirectIfStaff();

  const loaded = await safeApiCall(async () => {
    const odoo = await import("../../lib/odoo/auth");
    const me = await odoo.getAuthMe();
    if (!me.authenticated || !me.user) return null;
    const customer = await odoo.getCurrentCustomer();
    return { me, customer: customer ? odoo.toCustomerProfile(customer) : null };
  });
  if (!loaded.ok) return <StorefrontUnavailable />;
  if (!loaded.data?.customer) redirect("/login");
  const { me, customer } = loaded.data;
  const role = asAccountRole(customer.role);

  if (usesAccountDesk(role)) {
    return (
      <AccountDashboard
        name={me.user.name}
        email={me.user.email ?? ""}
        role={role}
        tradeStatus={customer.state}
      />
    );
  }

  const links = accountDashboardLinks(role, customer.state);
  const statusLabel = labelTradeStatus(customer.state);

  return (
    <StorefrontShell>
      <main className="sf-account sf-account-dash is-merchant">
        <p className="sf-kicker">{statusLabel}</p>
        <h1>Hello {me.user.name}</h1>
        <p className="sf-count">{me.user.email}</p>
        <p>Role: {labelAccountRole(role)}</p>
        <p>Trade status: {statusLabel}</p>
        {links.filter((item) => item.href !== "/account").map((item) => (
          <Link
            key={item.href}
            className={item.primary ? "sf-btn" : "sf-btn is-subtle"}
            href={item.href}
          >
            <span>{item.label}</span>
            {item.primary ? <span className="sf-arrow" aria-hidden>→</span> : null}
          </Link>
        ))}
        <form action={logoutAction}>
          <button className="sf-btn is-subtle" type="submit">
            <span>Sign out</span>
          </button>
        </form>
      </main>
    </StorefrontShell>
  );
}
