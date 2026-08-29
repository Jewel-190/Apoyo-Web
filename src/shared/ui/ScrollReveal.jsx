import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/**
 * Fades/slides content into view when it enters the viewport (scroll-driven reveal).
 * Respects prefers-reduced-motion.
 *
 * @param {boolean} [props.waitForUserScroll] — When true, stays hidden until the user scrolls
 *   (wheel, touch, or keyboard paging), then uses intersection as usual. Ignored when reduced motion is on.
 */
const ScrollReveal = (props) => {
  const {
    as: HtmlTag = "div",
    children,
    className = "",
    delay = 0,
    direction = "up",
    duration = 720,
    rootMargin = "0px 0px -6% 0px",
    threshold = 0.08,
    once = true,
    waitForUserScroll = false,
    ...rest
  } = props;
  const elRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [scrollUnlocked, setScrollUnlocked] = useState(() => reduced || !waitForUserScroll);

  const setTargetEl = useCallback((node) => {
    elRef.current = node;
  }, []);

  useEffect(() => {
    if (reduced) setScrollUnlocked(true);
  }, [reduced]);

  useEffect(() => {
    if (!waitForUserScroll || reduced) return;
    const unlock = () => setScrollUnlocked(true);
    const scroller = document.getElementById("app-scroll");
    scroller?.addEventListener("scroll", unlock, { passive: true });
    window.addEventListener("scroll", unlock, { passive: true, capture: true });
    document.addEventListener("scroll", unlock, { passive: true, capture: true });
    window.addEventListener("wheel", unlock, { passive: true });
    window.addEventListener("touchmove", unlock, { passive: true });
    const onKey = (e) => {
      if (
        e.key === "PageDown" ||
        e.key === "PageUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === " " ||
        e.key === "Home" ||
        e.key === "End"
      ) {
        unlock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      scroller?.removeEventListener("scroll", unlock);
      window.removeEventListener("scroll", unlock, true);
      document.removeEventListener("scroll", unlock, true);
      window.removeEventListener("wheel", unlock);
      window.removeEventListener("touchmove", unlock);
      window.removeEventListener("keydown", onKey);
    };
  }, [waitForUserScroll, reduced]);

  useEffect(() => {
    if (reduced || !scrollUnlocked) return;
    const el = elRef.current;
    if (!el) return;

    const scrollRoot = document.getElementById("app-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          if (once) observer.unobserve(entry.target);
          const show = () => setRevealed(true);
          if (waitForUserScroll) {
            requestAnimationFrame(() => requestAnimationFrame(show));
          } else {
            show();
          }
        } else if (!once) {
          setRevealed(false);
        }
      },
      { root: scrollRoot, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, scrollUnlocked, once, rootMargin, threshold, waitForUserScroll]);

  const visible = reduced || (scrollUnlocked && revealed);
  const gatedHidden = waitForUserScroll && !reduced && !scrollUnlocked;

  const dirClass =
    direction === "down"
      ? "scroll-reveal--from-down"
      : direction === "left"
        ? "scroll-reveal--from-left"
        : direction === "right"
          ? "scroll-reveal--from-right"
          : "scroll-reveal--from-up";

  return (
    <HtmlTag {...rest}>
      <div
        ref={setTargetEl}
        className={`scroll-reveal ${dirClass} ${visible ? "scroll-reveal--visible" : ""} ${className}`.trim()}
        style={{
          "--sr-duration": `${duration}ms`,
          "--sr-delay": `${delay}ms`,
          ...(gatedHidden ? { visibility: "hidden" } : undefined),
        }}
      >
        {children}
      </div>
    </HtmlTag>
  );
};

export default ScrollReveal;
