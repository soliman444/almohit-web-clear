import Link from "next/link";
import { BRAND } from "../../lib/brand";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  return (
    <footer className="sf-footer is-brand">
      <div className="sf-footer-inner">
        <div className="sf-footer-brand-block">
          <div className="sf-footer-brand-wrap">
            <BrandLogo variant="footer" />
          </div>
          <p className="sf-footer-tagline">
            A wholesale catalog you can browse first. Trade prices after approval.
          </p>
          <a className="sf-footer-mail" href="mailto:y.barakat@m-arabi.com">
            y.barakat@m-arabi.com
          </a>
        </div>

        <div className="sf-footer-top">
          <div>
            <p>Navigate</p>
            <Link href="/products">Products</Link>
            <Link href="/#discover">Collections</Link>
            <Link href="/about">About</Link>
          </div>
          <div>
            <p>Account</p>
            <Link href="/login">Sign in</Link>
            <Link href="/register">Create account</Link>
            <Link href="/account/business">Request approval</Link>
          </div>
          <div>
            <p>Social</p>
            <span>Instagram</span>
            <span>LinkedIn</span>
          </div>
        </div>
      </div>

      <div className="sf-footer-bottom">
        <span>© {new Date().getFullYear()} {BRAND.name}</span>
        <span>Trade prices after approval</span>
      </div>
    </footer>
  );
}
