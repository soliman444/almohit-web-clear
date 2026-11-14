"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { logoutAction } from "../../lib/actions/auth";
import {
  labelAccountRole,
  labelTradeStatus,
  type AccountNavItem,
} from "../../lib/account/role-nav";

function linkIsActive(pathname: string, href: string, allHrefs: string[]) {
  if (href === "/account") return pathname === "/account";
  const matches = pathname === href || pathname.startsWith(`${href}/`);
  if (!matches) return false;
  const longerMatch = allHrefs.some(
    (other) =>
      other !== href
      && other.startsWith(`${href}/`)
      && (pathname === other || pathname.startsWith(`${other}/`)),
  );
  return !longerMatch;
}

export function AccountDeskShell({
  name,
  email,
  role,
  tradeStatus,
  links,
  children,
}: {
  name: string;
  email: string;
  role: string;
  tradeStatus: string;
  links: AccountNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname() || "/account";
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const statusLabel = labelTradeStatus(tradeStatus);
  const roleLabel = labelAccountRole(role);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const hrefs = links.map((item) => item.href);
  const nav = (
    <nav className="sf-desk-nav" aria-label="Account workspace">
      {links.map((item) => {
        const active = linkIsActive(pathname, item.href, hrefs);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sf-desk-nav-link${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <span className="sf-desk-nav-label">{item.label}</span>
            <span className="sf-desk-nav-copy">{item.description}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="sf-desk">
      <aside className="sf-desk-rail" aria-label="Dashboard menu">
        <div className="sf-desk-brand">
          <p className="sf-kicker">{roleLabel}</p>
          <p className="sf-desk-brand-name">{name}</p>
          <p className="sf-desk-brand-email">{email}</p>
          <p className={`sf-biz-status ${tradeStatus === "approved" ? "is-approved" : tradeStatus === "pending" ? "is-pending" : tradeStatus === "rejected" ? "is-rejected" : ""}`.trim()}>
            {statusLabel}
          </p>
        </div>
        {nav}
        <form className="sf-desk-signout" action={logoutAction}>
          <button className="sf-desk-signout-btn" type="submit">
            Sign out
          </button>
        </form>
      </aside>

      <div className="sf-desk-main">
        <div className="sf-desk-toolbar">
          <button
            type="button"
            className="sf-desk-menu-btn"
            aria-expanded={open}
            aria-controls={titleId}
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <div className="sf-desk-toolbar-meta">
            <span>{roleLabel}</span>
            <span aria-hidden>·</span>
            <span>{statusLabel}</span>
          </div>
        </div>
        <div className="sf-desk-content">{children}</div>
      </div>

      <div
        className={`sf-desk-drawer${open ? " is-open" : ""}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="sf-desk-drawer-backdrop"
          aria-label="Close menu"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
        />
        <div
          className="sf-desk-drawer-panel"
          id={titleId}
          role="dialog"
          aria-modal="true"
          aria-label="Account menu"
        >
          <div className="sf-desk-drawer-head">
            <div>
              <p className="sf-kicker">{roleLabel}</p>
              <p className="sf-desk-brand-name">{name}</p>
            </div>
            <button type="button" className="sf-desk-drawer-close" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {nav}
          <form className="sf-desk-signout" action={logoutAction}>
            <button className="sf-desk-signout-btn" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
