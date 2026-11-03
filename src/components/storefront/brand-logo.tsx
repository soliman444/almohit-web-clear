import Image from "next/image";
import Link from "next/link";
import { BRAND } from "../../lib/brand";

export function BrandLogo({
  href = "/",
  variant = "header",
  onClick,
  priority = false,
}: {
  href?: string;
  variant?: "header" | "menu" | "hero" | "footer";
  onClick?: () => void;
  priority?: boolean;
}) {
  const large = variant === "footer" || variant === "hero";
  const mark = (
    <span className={`sf-brand-logo is-${variant}`}>
      <Image
        src={BRAND.logoSrc}
        alt={BRAND.logoAlt}
        width={large ? 560 : 336}
        height={large ? 320 : 192}
        sizes={large ? "(max-width: 700px) 220px, 320px" : "(max-width: 700px) 120px, 168px"}
        quality={100}
        // Keep logo pixels as authored — avoid a second JPEG pass that softens edges.
        unoptimized
        className="sf-brand-logo-img"
        priority={priority}
      />
    </span>
  );

  if (href === "") return mark;

  return (
    <Link
      className={`sf-logo sf-brand-link is-${variant}`}
      href={href}
      onClick={onClick}
      aria-label={BRAND.name}
    >
      {mark}
    </Link>
  );
}
