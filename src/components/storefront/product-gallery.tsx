"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

import { hoverScale } from "../../lib/media-system";
import { duration, ease } from "../../lib/motion";
import { fieldFor } from "../../lib/content/shots";
import type { ProductShot } from "../../lib/catalog/media";
import { viewTransitionName } from "../../lib/catalog/media";

import { MediaFrame } from "./media-frame";

export function ProductGallery({
  shots,
  name,
  slug,
  categorySlug,
  autoPlay = true,
  autoPlayDelay = 4500,
}: {
  shots: ProductShot[];
  name: string;
  slug: string;
  categorySlug?: string;
  autoPlay?: boolean;
  autoPlayDelay?: number;
}) {
  const reduce = useReducedMotion();

  const stage = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fine, setFine] = useState(false);
  const [paused, setPaused] = useState(false);

  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const x = useSpring(pointerX, {
    stiffness: 160,
    damping: 22,
    mass: 0.3,
  });

  const y = useSpring(pointerY, {
    stiffness: 160,
    damping: 22,
    mass: 0.3,
  });

  const { scrollYProgress } = useScroll({
    target: stage,
    offset: ["start start", "end start"],
  });

  const scrollScale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, reduce ? 1 : 1.035],
  );

  const scrollY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduce ? 0 : -24],
  );

  const current = shots[index];

  const empty =
    shots.length === 0 ||
    shots.every((shot) => failed[shot.src]);

  const accent = fieldFor(
    [...slug].reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0,
    ),
  );

  /*
   * Used to detect when the actual image set changes,
   * for example after selecting another variant.
   */
  const shotsKey = useMemo(
    () => shots.map((shot) => shot.src).join("|"),
    [shots],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * Reset to the first image whenever the product/variant
   * supplies a different image set.
   */
  useEffect(() => {
    setIndex(0);
    setDirection(1);
  }, [shotsKey]);

  useEffect(() => {
    const media = window.matchMedia(
      "(min-width: 901px) and (pointer: fine)",
    );

    const update = () => setFine(media.matches);

    update();

    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  /*
   * Automatic gallery rotation.
   *
   * A timeout instead of a permanent interval means that after
   * manual navigation the countdown restarts cleanly.
   */
  useEffect(() => {
    if (
      !autoPlay ||
      reduce ||
      paused ||
      open ||
      shots.length <= 1
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDirection(1);

      setIndex((value) => {
        return (value + 1) % shots.length;
      });
    }, autoPlayDelay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    autoPlay,
    autoPlayDelay,
    index,
    open,
    paused,
    reduce,
    shots.length,
  ]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }

      if (event.key === "ArrowRight") {
        go(1);
      }

      if (event.key === "ArrowLeft") {
        go(-1);
      }
    };

    window.addEventListener("keydown", onKey);

    document.body.style.overflow = "hidden";

    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, shots.length]);

  function go(step: number) {
    if (shots.length < 2) return;

    setDirection(step);

    setIndex(
      (value) =>
        (value + step + shots.length) % shots.length,
    );
  }

  function select(next: number) {
    if (next === index) return;

    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  function onPointer(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (!fine || reduce) return;

    const rect =
      event.currentTarget.getBoundingClientRect();

    pointerX.set(
      (((event.clientX - rect.left) / rect.width) * 2 -
        1) *
        6,
    );

    pointerY.set(
      (((event.clientY - rect.top) / rect.height) * 2 -
        1) *
        6,
    );
  }

  return (
    <div
      ref={stage}
      className={`sf-pdp-gallery is-${accent}${
        empty ? " is-empty" : ""
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <motion.div
        className="sf-pdp-stage"
        style={
          reduce
            ? undefined
            : {
                scale: scrollScale,
                y: scrollY,
              }
        }
      >
        <motion.button
          type="button"
          className={`sf-pdp-stage-frame${
            current?.isolated ? " is-isolated" : ""
          }`}
          data-view
          onClick={() => current && setOpen(true)}
          onMouseMove={onPointer}
          onMouseLeave={() => {
            pointerX.set(0);
            pointerY.set(0);
          }}
          initial={
            reduce
              ? false
              : {
                  clipPath:
                    "inset(10% 8% 10% 8%)",
                  scale: 1.03,
                }
          }
          animate={{
            clipPath:
              "inset(0% 0% 0% 0%)",
            scale: 1,
          }}
          transition={{
            duration: 0.64,
            ease,
            delay: 0.04,
          }}
          aria-label={`View ${name} fullscreen`}
          style={{
            viewTransitionName:
              viewTransitionName(slug),
          }}
        >
          <AnimatePresence
            custom={direction}
            mode="wait"
          >
            <motion.div
              key={current?.src ?? "empty"}
              className="sf-pdp-stage-image"
              custom={direction}
              variants={{
                enter: (step: number) => ({
                  opacity: 0,
                  x: step > 0 ? 20 : -20,
                  scale: 1.015,
                }),

                center: {
                  opacity: 1,
                  x: 0,
                  scale: 1,
                },

                exit: (step: number) => ({
                  opacity: 0,
                  x: step > 0 ? -16 : 16,
                  scale: 0.99,
                }),
              }}
              initial={reduce ? false : "enter"}
              animate="center"
              exit="exit"
              transition={{
                duration: 0.42,
                ease,
              }}
              style={
                fine && !reduce
                  ? { x: x, y }
                  : undefined
              }
              whileHover={
                fine && !reduce
                  ? {
                      scale: hoverScale(
                        current?.scale ?? 1,
                        current?.isolated
                          ? "ISOLATED_PRODUCT"
                          : "EDITORIAL_PHOTO",
                      ),
                    }
                  : undefined
              }
            >
              {current ? (
                <MediaFrame
                  src={current.src}
                  alt={current.alt || name}
                  seed={slug}
                  sizes="(max-width: 900px) 100vw, 760px"
                  priority
                  allowFallback={false}
                  preset="product-detail"
                  isolated={current.isolated}
                  categorySlug={categorySlug}
                  fitMode={current.fitMode}
                  focalX={current.focalX}
                  focalY={current.focalY}
                  scale={current.scale}
                  onStatus={(status) => {
                    if (status === "error") {
                      setFailed((value) => ({
                        ...value,
                        [current.src]: true,
                      }));
                    }
                  }}
                />
              ) : (
                <MediaFrame
                  src={null}
                  alt={name}
                  sizes="100vw"
                  allowFallback={false}
                  preset="product-detail"
                />
              )}
            </motion.div>
          </AnimatePresence>

          <span className="sf-pdp-stage-hint">
            View large
          </span>

          {shots.length > 1 && (
            <div
              className="sf-pdp-auto-indicator"
              aria-hidden
            >
              <span
                key={`${index}-${shotsKey}`}
                style={{
                  animationDuration: `${autoPlayDelay}ms`,
                }}
              />
            </div>
          )}
        </motion.button>
      </motion.div>

      {shots.length > 0 && (
        <div className="sf-pdp-thumbs">
          {shots.map((shot, item) => (
            <button
              key={shot.src}
              type="button"
              className={`sf-pdp-thumb${
                item === index
                  ? " is-active"
                  : ""
              }`}
              onClick={() => select(item)}
              aria-label={`Image ${item + 1}`}
              aria-current={
                item === index
                  ? "true"
                  : undefined
              }
            >
              {String(item + 1).padStart(2, "0")}
            </button>
          ))}

          <span className="sf-pdp-counter">
            {String(index + 1).padStart(2, "0")}
            {" / "}
            {String(
              Math.max(shots.length, 1),
            ).padStart(2, "0")}
          </span>
        </div>
      )}

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open && current && (
                <motion.div
                  className="sf-pdp-viewer"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${name} image`}
                  initial={
                    reduce
                      ? false
                      : { opacity: 0 }
                  }
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: duration.base,
                    ease,
                  }}
                  onClick={() =>
                    setOpen(false)
                  }
                  onTouchStart={(event) => {
                    (
                      event.currentTarget as HTMLElement
                    ).dataset.x = String(
                      event.changedTouches[0]
                        ?.clientX ?? 0,
                    );
                  }}
                  onTouchEnd={(event) => {
                    const start = Number(
                      (
                        event.currentTarget as HTMLElement
                      ).dataset.x ?? 0,
                    );

                    const delta =
                      (event.changedTouches[0]
                        ?.clientX ?? start) -
                      start;

                    if (delta > 48) {
                      go(-1);
                    }

                    if (delta < -48) {
                      go(1);
                    }
                  }}
                >
                  <button
                    ref={closeRef}
                    type="button"
                    className="sf-pdp-viewer-close"
                    aria-label="Close image"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpen(false);
                    }}
                  >
                    ×
                  </button>

                  <motion.div
                    className="sf-pdp-viewer-frame"
                    initial={
                      reduce
                        ? false
                        : {
                            scale: 0.98,
                            opacity: 0,
                          }
                    }
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    exit={{
                      scale: 0.99,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.36,
                      ease,
                    }}
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    <AnimatePresence
                      custom={direction}
                      mode="wait"
                    >
                      <motion.div
                        key={current.src}
                        className="sf-pdp-viewer-image"
                        custom={direction}
                        initial={
                          reduce
                            ? false
                            : {
                                opacity: 0,
                                x:
                                  direction > 0
                                    ? 24
                                    : -24,
                              }
                        }
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x:
                            direction > 0
                              ? -20
                              : 20,
                        }}
                        transition={{
                          duration: 0.34,
                          ease,
                        }}
                      >
                        <MediaFrame
                          src={current.src}
                          alt={
                            current.alt || name
                          }
                          seed={slug}
                          sizes="100vw"
                          allowFallback={false}
                          preset="product-detail"
                          isolated={
                            current.isolated
                          }
                          categorySlug={
                            categorySlug
                          }
                          fitMode="CONTAIN"
                          focalX={50}
                          focalY={50}
                          scale={1}
                          className="sf-fill is-viewer"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>

                  <div className="sf-pdp-viewer-ui">
                    <span>
                      {String(index + 1).padStart(
                        2,
                        "0",
                      )}
                      {" / "}
                      {String(
                        Math.max(
                          shots.length,
                          1,
                        ),
                      ).padStart(2, "0")}
                    </span>

                    {shots.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            go(-1);
                          }}
                        >
                          Previous
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            go(1);
                          }}
                        >
                          Next
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}