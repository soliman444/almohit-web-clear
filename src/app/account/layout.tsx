import { AccountDeskShell } from "../../components/storefront/account-desk-shell";
import { StorefrontShell } from "../../components/storefront/shell";
import {
  accountDashboardLinks,
  asAccountRole,
  usesAccountDesk,
} from "../../lib/account/role-nav";
import { safeApiCall } from "../../lib/odoo/safe";
import { redirectIfStaff } from "../../lib/session/access";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfStaff();

  const loaded = await safeApiCall(async () => {
    const odoo = await import("../../lib/odoo/auth");
    const me = await odoo.getAuthMe();
    if (!me.authenticated || !me.user) return null;
    const customer = await odoo.getCurrentCustomer();
    if (!customer) return null;
    return {
      name: me.user.name,
      email: me.user.email,
      role: asAccountRole(customer.role),
      tradeStatus: customer.tradeStatus,
    };
  });

  if (!loaded.ok || !loaded.data) {
    return children;
  }

  const { name, email, role, tradeStatus } = loaded.data;
  if (!usesAccountDesk(role)) {
    return children;
  }

  return (
    <StorefrontShell>
      <AccountDeskShell
        name={name}
        email={email ?? ""}
        role={role}
        tradeStatus={tradeStatus}
        links={accountDashboardLinks(role, tradeStatus)}
      >
        {children}
      </AccountDeskShell>
    </StorefrontShell>
  );
}
