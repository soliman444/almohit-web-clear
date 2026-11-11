"use client";

import { motion, useReducedMotion } from "motion/react";
import { duration, ease } from "../../lib/motion";
import { ButtonLink } from "./button-link";
import { Reveal } from "./reveal";

const BENEFITS = [
  { title: "Approved account", copy: "Trade access after a short review." },
  { title: "Trade prices", copy: "Wholesale rates once your account is live." },
  { title: "Faster orders", copy: "Clear MOQ and stock for every case." },
] as const;

export function WholesaleCta() {
  const reduce = useReducedMotion();
  return (
    <section className="sf-cta is-brand">
      <div className="sf-cta-texture" aria-hidden />
      <motion.div
        className="sf-cta-glow is-mango"
        animate={reduce ? undefined : { x: [0, -18, 10, 0], y: [0, 14, -8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="sf-cta-glow is-leaf"
        animate={reduce ? undefined : { x: [0, 16, -10, 0], y: [0, -12, 10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />

      <Reveal className="sf-cta-panel">
        <p className="sf-cta-kicker">Wholesale desk</p>
        <h2>Unlock wholesale pricing.</h2>
        <p className="sf-cta-lede">
          Browse the catalog now. Request a business account to unlock trade prices and place case orders.
        </p>

        <div className="sf-cta-benefits">
          {BENEFITS.map((item) => (
            <div className="sf-cta-benefit" key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.copy}</span>
            </div>
          ))}
        </div>

        <div className="sf-cta-actions">
          <ButtonLink href="/register">Request a business account</ButtonLink>
          <ButtonLink href="/#catalog" ghost>
            Browse catalog
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
