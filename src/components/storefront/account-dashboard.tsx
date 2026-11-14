import {
  asAccountRole,
  labelAccountRole,
  labelTradeStatus,
  roleDeskCopy,
} from "../../lib/account/role-nav";

/** Desk overview panel (non-merchant). Merchant account keeps a separate simple list. */
export function AccountDashboard({
  name,
  email,
  role,
  tradeStatus,
}: {
  name: string;
  email: string;
  role: string;
  tradeStatus: string;
}) {
  const accountRole = asAccountRole(role);
  const copy = roleDeskCopy(accountRole);
  const statusLabel = labelTradeStatus(tradeStatus);
  const statusClass =
    tradeStatus === "approved"
      ? "is-approved"
      : tradeStatus === "pending"
        ? "is-pending"
        : tradeStatus === "rejected"
          ? "is-rejected"
          : "";

  if (accountRole === "merchant") {
    return null;
  }

  return (
    <main className={`sf-account sf-desk-page is-${accountRole}`}>
      <header className="sf-desk-page-hero">
        <div className="sf-desk-page-hero-top">
          <p className="sf-kicker">{copy.kicker}</p>
          <p className={`sf-biz-status ${statusClass}`.trim()}>{statusLabel}</p>
        </div>
        <h1>{copy.title}</h1>
        <p className="sf-count">{copy.blurb}</p>
        <dl className="sf-desk-page-meta">
          <div>
            <dt>Signed in</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{labelAccountRole(accountRole)}</dd>
          </div>
        </dl>
      </header>

      {tradeStatus !== "approved" ? (
        <p className="sf-desk-page-note" role="status">
          Use Trade account in the side menu to submit or review your application. Workspace tools unlock after approval.
        </p>
      ) : (
        <p className="sf-desk-page-note is-ready" role="status">
          Choose a section from the side menu. On phones, open Menu to switch sections without leaving the desk.
        </p>
      )}
    </main>
  );
}
