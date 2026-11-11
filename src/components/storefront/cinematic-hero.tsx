"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { duration, ease, stagger } from "../../lib/motion";
import { BRAND } from "../../lib/brand";
import { BrandLogo } from "./brand-logo";
import { ButtonLink } from "./button-link";

type Collection = { index: string; name: string; href: string };

const TITLE = ["Cases ready", "for your shelves."] as const;

export function CinematicHero({
  collections: _collections,
}: {
  collections: Collection[];
  /** Kept for call-site compatibility; stage hero does not use video framing. */
  image?: string | null;
  focalX?: number | null;
  focalY?: number | null;
  frameScale?: number | null;
}) {
  void _collections;
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const { scrollY } = useScroll();
  const stageY = useTransform(scrollY, [0, 640], [0, 48]);
  const stageScale = useTransform(scrollY, [0, 640], [1, 1.06]);
  const orbY = useTransform(scrollY, [0, 640], [0, -36]);

  useEffect(() => {
    setReady(true);
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const reduce = ready && (Boolean(reduceMotion) || compact);

  return (
    <section className="sf-hero is-stage" aria-label={`${BRAND.name} wholesale hero`}>
      <div className="sf-hero-atmosphere" aria-hidden>
        <motion.span
          className="sf-hero-orb is-mango"
          style={ready && !reduce ? { y: orbY } : undefined}
        />
        <span className="sf-hero-orb is-leaf" />
        <span className="sf-hero-grain" />
      </div>

      <motion.div
        className="sf-hero-stage"
        style={ready && !reduce ? { y: stageY, scale: stageScale } : undefined}
      >
        <motion.div
          className="sf-hero-mark"
          initial={reduce ? false : { opacity: 0, scale: 0.94, y: 22 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: duration.cinematic, ease }}
        >
          <div className="sf-hero-plate">
            <BrandLogo href="/" variant="hero" priority />
          </div>
        </motion.div>
        <p className="sf-hero-stage-caption">{BRAND.nameAr}</p>
      </motion.div>

      <div className="sf-hero-copy">
        <motion.p
          className="sf-hero-brand-word"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.reveal, ease, delay: 0.08 }}
        >
          {BRAND.name}
        </motion.p>

        <h1 className="sf-hero-title">
          {TITLE.map((line, index) => (
            <span className="sf-clip" key={line}>
              <span
                className="sf-line"
                style={
                  reduce
                    ? undefined
                    : { animationDelay: `${0.16 + index * stagger.display}s` }
                }
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <motion.p
          className="sf-hero-support"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease, delay: 0.3 }}
        >
          Clear MOQ, live stock, and trade pricing after approval — built for shops that buy by the case.
        </motion.p>

        <motion.div
          className="sf-hero-cta"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease, delay: 0.4 }}
        >
          <ButtonLink href="/#catalog" plain>Shop newest arrivals</ButtonLink>
          <ButtonLink href="/#discover" ghost plain>Browse categories</ButtonLink>
        </motion.div>
      </div>
    </section>
  );
}
