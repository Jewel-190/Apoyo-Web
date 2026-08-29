import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HiDocumentText, HiPhone, HiUserGroup } from "react-icons/hi2";
import ScrollReveal from "../shared/ui/ScrollReveal";
import { usePrefersReducedMotion } from "../shared/hooks/usePrefersReducedMotion";
import { instrument } from "../shared/lib/fonts";
import { resolveSiteAccentColor } from "../shared/lib/webTheme";
import { usePageContent } from "../shared/content/WebContentContext";
import { RichText, plainText } from "../shared/content/richText";
import ContentImage from "../shared/ui/ContentImage";
import { isExternalHref, safeHref } from "../shared/lib/safeHref";

/* Visual treatment only — content (icon choice) comes from the DB. */
const PILLAR_ICONS = { users: HiUserGroup, document: HiDocumentText, phone: HiPhone };
const PILLAR_STYLES = [
  {
    ring: "ring-brand/25",
    iconWrap: "bg-brand text-white shadow-lg shadow-brand-ink/30",
    glow: "from-brand/12 via-transparent to-transparent",
    headingTone: "text-brand-ink",
  },
  {
    ring: "ring-indigo-500/25",
    iconWrap: "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30",
    glow: "from-indigo-500/12 via-transparent to-transparent",
    headingTone: "text-indigo-950",
  },
  {
    ring: "ring-amber-400/30",
    iconWrap: "bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950 shadow-lg shadow-amber-900/25",
    glow: "from-amber-500/14 via-transparent to-transparent",
    headingTone: "text-amber-950",
  },
];

function HeroVideo({ hero }) {
  const reduced = usePrefersReducedMotion();
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;
    const play = () => {
      video.play()?.catch(() => {});
    };
    video.addEventListener("loadeddata", play);
    play();
    return () => video.removeEventListener("loadeddata", play);
  }, [reduced]);

  const poster = hero.poster || undefined;

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative min-h-[62vh] md:min-h-[76vh] lg:min-h-[80vh]">
        {!reduced && hero.videoSrc ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            aria-hidden
            style={{ transform: "translateZ(0)" }}
          >
            <source src={hero.videoSrc} type="video/mp4" />
          </video>
        ) : null}

        <div
          className={`absolute inset-0 bg-cover bg-center ${
            reduced ? "opacity-100" : "opacity-0 md:opacity-[0.08]"
          }`}
          style={poster ? { backgroundImage: `url(${poster})` } : undefined}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/65"
          aria-hidden
        />
        <div className="absolute inset-0 bg-brand/15 mix-blend-soft-light" aria-hidden />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-16 text-center md:py-24">
          {hero.logo ? (
            <div className="mb-6 flex items-center justify-center gap-3">
              <ContentImage
                src={hero.logo}
                alt={plainText(hero.logoAlt)}
                slot="logo"
                imgClassName="drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
                loading="eager"
              />
            </div>
          ) : null}
          <RichText
            as="p"
            value={hero.eyebrow}
            className="mb-3 text-xs uppercase tracking-[0.22em] text-white/85"
            style={instrument}
          />
          <RichText
            as="h1"
            value={hero.heading}
            accent
            className="mb-4 max-w-3xl text-balance text-2xl leading-tight text-white drop-shadow-md md:text-4xl md:leading-tight"
            style={{ ...instrument, fontWeight: 600 }}
          />
          <RichText
            as="p"
            value={hero.subcopy}
            className="max-w-2xl text-sm leading-relaxed text-white/90 md:text-base"
            style={instrument}
          />
        </div>
      </div>
    </section>
  );
}

function SloganBand({ slogan }) {
  if (!slogan?.image) return null;
  return (
    <ScrollReveal
      as="section"
      className="relative z-10 w-full max-w-[100vw] bg-gradient-to-r from-brand-page-from via-brand-page-via to-brand-page-to px-4 py-10 md:py-12"
      delay={30}
      duration={780}
      rootMargin="0px 0px -24px 0px"
      threshold={0}
      waitForUserScroll
    >
      <div className="mx-auto flex min-w-0 max-w-6xl flex-col items-center justify-center text-center">
        <ContentImage src={slogan.image} alt={plainText(slogan.alt)} slot="slogan" />
      </div>
    </ScrollReveal>
  );
}

function HowApoyoFits({ howFits }) {
  const pillars = Array.isArray(howFits.pillars) ? howFits.pillars : [];
  return (
    <ScrollReveal
      as="section"
      className="relative z-10 w-full overflow-hidden bg-gradient-to-b from-brand-muted via-brand-wash to-brand-soft px-4 pb-16 pt-6 md:pb-20 md:pt-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.65]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 90% 55% at 50% -20%, rgba(var(--web-primary-rgb), 0.11), transparent), radial-gradient(ellipse 55% 40% at 100% 80%, rgba(79, 70, 229, 0.07), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] shadow-[0_40px_100px_-50px_rgba(var(--web-ink-rgb),0.55)] ring-1 ring-brand-ink/20">
          <div className="relative bg-gradient-to-br from-brand-deep via-brand-deep-mid to-brand-deep-via px-6 pb-28 pt-12 text-center md:px-12 md:pb-32 md:pt-14">
            <div
              className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-brand-highlight/20 blur-[60px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/15 blur-[70px]"
              aria-hidden
            />
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-on-deep/95 md:text-xs"
              style={instrument}
            >
              {howFits.kicker}
            </p>
            <RichText
              as="p"
              value={howFits.intro}
              className="mx-auto mt-6 max-w-2xl text-[17px] leading-[1.72] text-white/92 md:text-lg md:leading-[1.75]"
              style={instrument}
            />
          </div>
        </div>

        <div className="relative -mt-20 px-4 pb-10 md:-mt-24 md:px-8 md:pb-12">
          <ul
            className="mx-auto grid max-w-6xl list-none gap-5 md:grid-cols-3 md:items-stretch md:gap-6"
            style={instrument}
          >
            {pillars.map((pillar, index) => {
              const Icon = PILLAR_ICONS[pillar.icon] ?? HiUserGroup;
              const theme = PILLAR_STYLES[index % PILLAR_STYLES.length];
              return (
                <li
                  key={`${pillar.kicker}-${index}`}
                  className={`group relative flex flex-col rounded-2xl border border-white/70 bg-white/95 p-7 shadow-[0_24px_50px_-32px_rgba(15,23,42,0.35)] backdrop-blur-md motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_36px_60px_-36px_rgba(var(--web-primary-rgb),0.28)] md:p-8 md:ring-2 ${theme.ring} ${
                    index === 1 ? "md:-translate-y-1" : ""
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b ${theme.glow}`}
                    aria-hidden
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${theme.iconWrap}`}
                    >
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span
                      className="rounded-full border border-gray-200/90 bg-gray-50 px-2.5 py-1 text-[11px] font-bold tabular-nums text-gray-500"
                      style={instrument}
                    >
                      {pillar.num}
                    </span>
                  </div>
                  <h3
                    className={`relative mt-6 text-xs font-bold uppercase tracking-[0.18em] md:text-[13px] ${theme.headingTone}`}
                    style={instrument}
                  >
                    {pillar.kicker}
                  </h3>
                  <RichText
                    as="p"
                    value={pillar.body}
                    className="relative mt-3 flex-1 text-[15px] leading-relaxed text-gray-600"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </ScrollReveal>
  );
}

function LivingShowcase({ showcase }) {
  const reduced = usePrefersReducedMotion();
  const slides = Array.isArray(showcase.slides) ? showcase.slides : [];
  const intervalMs = Number(showcase.intervalMs) || 5200;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [reduced, slides.length, intervalMs, active]);

  if (!slides.length) return null;
  const current = slides[active] ?? slides[0];

  return (
    <ScrollReveal
      as="section"
      className="w-full bg-gradient-to-b from-brand-soft via-brand-wash to-white px-4 pb-12 pt-8 sm:pb-16 sm:pt-10"
      delay={40}
    >
      <div
        className="mx-auto max-w-6xl space-y-6 sm:space-y-7"
        style={reduced ? undefined : { "--showcase-duration": `${intervalMs}ms` }}
      >
        <div className="text-center lg:text-left">
          <RichText
            as="h2"
            value={showcase.heading}
            accent
            className="text-balance text-xl font-semibold leading-snug tracking-tight text-gray-900 sm:text-2xl"
            style={{ ...instrument, fontWeight: 600 }}
          />
          <RichText
            as="p"
            value={showcase.subcopy}
            className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 lg:mx-0"
            style={instrument}
          />
        </div>

        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-brand-ink/20 bg-gradient-to-br from-slate-950 via-brand-deep to-brand-deep-mid p-2.5 shadow-[0_20px_55px_-28px_rgba(var(--web-primary-rgb),0.5)] sm:rounded-[1.35rem] sm:p-3 md:p-3.5">
          <div
            className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-brand/20 blur-3xl showcase-orbit-bg"
            aria-hidden
          />
          {/* Fixed aspect + isolate keeps the stage size stable across slides */}
          <div className="relative isolate aspect-[16/10] overflow-hidden rounded-xl [contain:layout_paint] sm:rounded-2xl">
            {!reduced ? (
              <div className="absolute left-0 right-0 top-0 z-20 h-1 bg-white/10">
                <div
                  key={active}
                  className="h-full w-full origin-left bg-gradient-to-r from-brand-highlight via-brand to-brand-on-deep showcase-timer-fill"
                />
              </div>
            ) : null}

            {slides.map((slide, index) => (
              <ContentImage
                key={`${slide.src}-${index}`}
                src={slide.src}
                alt={plainText(slide.alt)}
                slot="cover"
                className={`absolute inset-0 h-full w-full transform-gpu backface-hidden transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  active === index ? "z-10 opacity-100" : "z-0 opacity-0"
                }`}
                loading={index <= 1 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            ))}

            <div
              className="pointer-events-none absolute inset-0 z-[11] bg-gradient-to-t from-black/85 via-black/20 to-black/30"
              aria-hidden
            />

            <div className="absolute inset-x-0 bottom-0 z-[12] flex flex-col items-center gap-2 p-3 sm:gap-3 sm:p-4">
              {/* Reserved height so title/subtitle swaps don't nudge the frame */}
              <div className="flex w-full max-w-md min-h-[5.75rem] flex-col justify-center rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-center backdrop-blur-md sm:min-h-[6.5rem] sm:px-4 sm:py-3">
                {showcase.overlayLabel ? (
                  <p
                    className="text-[9px] uppercase tracking-[0.2em] text-brand-on-deep/95 sm:text-[10px]"
                    style={instrument}
                  >
                    {showcase.overlayLabel}
                  </p>
                ) : null}
                <p
                  className="mt-0.5 line-clamp-1 text-base font-semibold tracking-tight text-white sm:text-lg"
                  style={{ ...instrument, fontWeight: 600 }}
                >
                  {current.title}
                </p>
                <RichText
                  as="p"
                  value={current.subtitle}
                  className="mt-1 line-clamp-2 min-h-[2.25rem] text-xs leading-snug text-white/75 sm:min-h-[2.5rem] sm:text-sm"
                  style={instrument}
                />
              </div>
              <div className="flex h-5 shrink-0 items-center justify-center gap-1 rounded-full bg-black/40 px-1 sm:h-6 sm:p-1.5">
                {slides.map((slide, index) => (
                  <button
                    key={`dot-${slide.src}-${index}`}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={active === index ? "true" : undefined}
                    onClick={() => setActive(index)}
                    className={`h-2 rounded-full transition-[width,background-color] duration-500 ease-out ${
                      active === index ? "w-8 bg-brand-highlight" : "w-2 bg-white/35 hover:bg-white/55"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-1.5 overflow-x-auto overflow-y-hidden pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {slides.map((slide, index) => (
            <button
              key={`thumb-${slide.src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show ${plainText(slide.title)}`}
              aria-current={active === index ? "true" : undefined}
              className={`relative h-14 w-[4.75rem] shrink-0 overflow-hidden rounded-lg ring-2 transition-[opacity,box-shadow,ring-color] duration-500 ease-out sm:h-16 sm:w-[5.5rem] ${
                active === index
                  ? "opacity-100 ring-brand-highlight shadow-md shadow-brand-ink/35"
                  : "opacity-80 ring-white/10 hover:opacity-100 hover:ring-brand-on-deep/60"
              }`}
            >
              <ContentImage
                src={slide.src}
                alt=""
                slot="cover"
                className="absolute inset-0 h-full w-full"
                loading="eager"
              />
              <span
                className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-center text-[9px] font-medium text-white sm:text-[10px]"
                style={instrument}
              >
                {slide.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

function normalizeDownloadLinks(download = {}) {
  const links = Array.isArray(download.links) ? download.links : [];
  const usable = links.filter(
    (link) => String(link?.href ?? "").trim() || String(link?.image ?? "").trim() || String(link?.label ?? "").trim()
  );
  if (usable.length) return usable;
  if (download.badgeImage || download.storeHref) {
    return [
      {
        label: "App store",
        image: download.badgeImage || "",
        alt: download.badgeAlt || "",
        href: download.storeHref || "",
      },
    ];
  }
  return [];
}

function DownloadApp({ download }) {
  const benefits = Array.isArray(download.benefits) ? download.benefits : [];
  // Show any link that has an image and/or a URL (don't hide badges when href is still empty).
  const links = normalizeDownloadLinks(download).filter(
    (link) => String(link?.href ?? "").trim() || String(link?.image ?? "").trim()
  );

  return (
    <ScrollReveal
      as="section"
      className="w-full bg-gradient-to-r from-white via-brand-wash to-brand-muted px-4 py-16 md:py-20"
      delay={60}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-12">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-brand" style={instrument}>
            {download.kicker}
          </p>
          <RichText
            as="h2"
            value={download.heading}
            accent
            className="mb-4 text-3xl leading-tight text-gray-900 md:text-4xl"
            style={{ ...instrument, fontWeight: 600 }}
          />
          <RichText
            as="p"
            value={download.paragraph}
            className="mb-6 text-sm leading-relaxed text-gray-600 md:text-base"
            style={instrument}
          />
          <ul className="mb-8 space-y-3">
            {benefits.map((item, index) => (
              <li key={index} className="flex gap-3 text-sm text-gray-700" style={instrument}>
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-brand"
                  aria-hidden
                />
                <RichText as="span" value={item} />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-4 md:items-end">
          {links.length ? (
            <div className="flex w-fit flex-wrap items-center justify-center gap-2.5 md:ml-auto md:justify-end">
              {links.map((link, index) => {
                const href = safeHref(link.href);
                const label = String(link.label ?? "").trim() || "Download";
                const image = String(link.image ?? "").trim();
                const alt = plainText(link.alt) || label;
                const external = isExternalHref(href);
                const externalProps = external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {};
                const badgeClass =
                  "inline-block w-fit p-0 leading-none transition-transform duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

                if (image) {
                  const badge = <ContentImage src={image} alt={alt} slot="badge" />;
                  if (!href) {
                    return (
                      <span key={`badge-${index}`} className={badgeClass} role="img" aria-label={alt}>
                        {badge}
                      </span>
                    );
                  }
                  return (
                    <a
                      key={`badge-${index}`}
                      href={href}
                      aria-label={alt}
                      className={badgeClass}
                      {...externalProps}
                    >
                      {badge}
                    </a>
                  );
                }

                if (!href) return null;

                return (
                  <a
                    key={`label-${index}`}
                    href={href}
                    className="inline-flex items-center justify-center rounded-xl border border-brand/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand-ink transition-transform duration-300 hover:scale-105 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    style={instrument}
                    {...externalProps}
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          ) : null}
          <RichText
            as="p"
            value={download.disclaimer}
            className="max-w-xs text-center text-xs text-gray-400 md:text-right"
            style={instrument}
          />
        </div>
      </div>
    </ScrollReveal>
  );
}

function PhoneShowcase({ phones }) {
  const items = Array.isArray(phones.items) ? phones.items : [];
  const initialIndex = items.length > 1 ? Math.min(1, items.length - 1) : 0;
  const [activePhone, setActivePhone] = useState(initialIndex);
  const scrollerRef = useRef(null);
  const dotsRef = useRef(null);
  const itemRefs = useRef([]);
  const ignoreScrollRef = useRef(false);
  const caption = items[activePhone] ?? items[0];
  const multi = items.length > 1;

  const scrollToIndex = (index, behavior = "smooth") => {
    const scroller = scrollerRef.current;
    const el = itemRefs.current[index];
    if (!scroller || !el) return;
    ignoreScrollRef.current = true;
    const scrollerRect = scroller.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const left =
      scroller.scrollLeft +
      (elRect.left - scrollerRect.left) -
      (scroller.clientWidth - elRect.width) / 2;
    scroller.scrollTo({ left: Math.max(0, left), behavior });
    window.setTimeout(
      () => {
        ignoreScrollRef.current = false;
      },
      behavior === "smooth" ? 450 : 80
    );
  };

  const selectPhone = (index) => {
    const next = Math.max(0, Math.min(items.length - 1, index));
    setActivePhone(next);
    scrollToIndex(next);
  };

  // Keep index valid when CMS adds/removes screens.
  useEffect(() => {
    if (!items.length) return;
    setActivePhone((prev) => {
      if (prev >= items.length) return items.length - 1;
      return prev;
    });
    const id = window.requestAnimationFrame(() => {
      const idx = Math.min(activePhone, items.length - 1);
      scrollToIndex(idx, "auto");
    });
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-center when entry count changes
  }, [items.length]);

  // Keep active index in sync while the user swipes / scrolls the carousel.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length <= 1) return;

    let frame = 0;
    const syncFromScroll = () => {
      if (ignoreScrollRef.current) return;
      const scrollerCenter = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.left + rect.width / 2;
        const dist = Math.abs(mid - scrollerCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActivePhone((prev) => (prev === best ? prev : best));
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(syncFromScroll);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("scrollend", syncFromScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("scrollend", syncFromScroll);
    };
  }, [items.length]);

  // Keep the active dot visible in the horizontal dots strip.
  useEffect(() => {
    const dots = dotsRef.current;
    const activeDot = dots?.querySelector("[data-active='true']");
    if (!dots || !activeDot) return;
    const left =
      activeDot.offsetLeft - (dots.clientWidth - activeDot.offsetWidth) / 2;
    dots.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [activePhone]);

  if (!items.length) return null;

  return (
    <ScrollReveal
      as="section"
      className="w-full overflow-x-clip bg-gradient-to-r from-white via-brand-wash to-brand-muted py-16 sm:py-20"
      delay={100}
    >
      <div className="mx-auto mb-8 max-w-2xl px-4 text-center sm:mb-12">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-brand" style={instrument}>
          {phones.kicker}
        </p>
        <RichText
          as="h2"
          value={phones.heading}
          className="mb-3 text-3xl text-gray-900 md:text-4xl"
          style={{ ...instrument, fontWeight: 600 }}
        />
        <RichText
          as="p"
          value={phones.intro}
          className="text-sm leading-relaxed text-gray-600 md:text-base"
          style={instrument}
        />
        {multi ? (
          <p className="mt-3 text-xs text-gray-400" style={instrument} aria-hidden>
            Swipe or use arrows to explore · {items.length} screens
          </p>
        ) : null}
      </div>

      {/* Full-bleed carousel — larger phones, tight padding so the frame stays the same size */}
      <div
        className="relative w-screen max-w-[100vw] left-1/2 -translate-x-1/2 py-2 sm:py-3"
        onKeyDown={(e) => {
          if (!multi) return;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            selectPhone(activePhone - 1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            selectPhone(activePhone + 1);
          }
        }}
      >
        {multi ? (
          <>
            <button
              type="button"
              aria-label="Previous preview"
              disabled={activePhone <= 0}
              onClick={() => selectPhone(activePhone - 1)}
              className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand/20 bg-white/95 text-xl leading-none text-brand shadow-md backdrop-blur-sm transition enabled:hover:bg-white enabled:active:scale-95 disabled:opacity-30 sm:left-4 sm:h-11 sm:w-11 lg:left-6"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next preview"
              disabled={activePhone >= items.length - 1}
              onClick={() => selectPhone(activePhone + 1)}
              className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand/20 bg-white/95 text-xl leading-none text-brand shadow-md backdrop-blur-sm transition enabled:hover:bg-white enabled:active:scale-95 disabled:opacity-30 sm:right-4 sm:h-11 sm:w-11 lg:right-6"
            >
              ›
            </button>
          </>
        ) : null}

        <div
          ref={scrollerRef}
          className="scrollbar-touch-hide flex w-full snap-x snap-mandatory items-center gap-3 overflow-x-auto px-[calc(50vw-min(43vw,170px))] py-4 sm:gap-5 sm:px-[calc(50vw-min(38vw,180px))] sm:py-5 lg:gap-6 lg:px-[calc(50vw-170px)] lg:py-6"
        >
          {items.map((phone, index) => {
            const isActive = activePhone === index;
            const tilt = isActive
              ? "rotate-0"
              : index < activePhone
                ? "-rotate-3 sm:-rotate-4 lg:-rotate-6"
                : "rotate-3 sm:rotate-4 lg:rotate-6";
            return (
              <button
                key={`${phone.src}-${index}`}
                type="button"
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => selectPhone(index)}
                aria-label={plainText(phone.alt) || `Show preview ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
                className={`w-[min(86vw,340px)] shrink-0 snap-center transition-all duration-500 ease-out sm:w-[min(76vw,360px)] lg:w-[340px] ${
                  isActive
                    ? `z-20 scale-100 drop-shadow-md ${tilt}`
                    : `z-10 scale-[0.92] opacity-70 drop-shadow-sm lg:opacity-75 lg:hover:scale-[0.96] lg:hover:opacity-100 ${tilt}`
                }`}
              >
                <ContentImage
                  src={phone.src}
                  alt={plainText(phone.alt)}
                  slot="phone"
                  draggable={false}
                  loading={Math.abs(index - activePhone) <= 1 ? "eager" : "lazy"}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-6xl flex-col items-center gap-4 px-4 sm:mt-10">
        {multi ? (
          <div className="flex w-full max-w-md flex-col items-center gap-2">
            <p className="text-xs tabular-nums text-gray-500" style={instrument}>
              {activePhone + 1} / {items.length}
            </p>
            <div
              ref={dotsRef}
              className="scrollbar-touch-hide flex max-w-full gap-2 overflow-x-auto px-1 py-1"
            >
              {items.map((phone, index) => (
                <button
                  key={`pdot-${phone.src}-${index}`}
                  type="button"
                  data-active={activePhone === index ? "true" : "false"}
                  onClick={() => selectPhone(index)}
                  aria-label={`Show preview ${index + 1}`}
                  aria-current={activePhone === index ? "true" : undefined}
                  className={`h-2.5 shrink-0 rounded-full transition-all duration-300 ${
                    activePhone === index ? "w-8 bg-brand" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
        {caption ? (
          <p className="min-h-[3rem] max-w-lg text-center text-sm text-gray-700" style={instrument}>
            <span className="font-semibold text-gray-900">{caption.captionTitle}</span>
            <span className="text-gray-500"> · </span>
            <RichText as="span" value={caption.captionDetail} />
          </p>
        ) : null}
        {phones.ctaLabel ? (
          <Link
            to={phones.ctaRoute || "/services"}
            className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-gradient-to-r from-brand-soft to-brand-wash px-6 py-2.5 text-sm text-brand shadow-sm shadow-brand/10 transition-transform hover:-translate-y-0.5"
            style={{ ...instrument, fontWeight: 600 }}
          >
            {phones.ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        ) : null}
      </div>
    </ScrollReveal>
  );
}

function QuickLinks({ quickLinks }) {
  const items = Array.isArray(quickLinks.items) ? quickLinks.items : [];

  return (
    <ScrollReveal
      as="section"
      className="w-full bg-gradient-to-b from-brand-soft via-brand-wash to-brand-muted px-4 py-16 md:py-20"
      delay={80}
    >
      <div className="mx-auto max-w-5xl">
        <RichText
          as="h2"
          value={quickLinks.heading}
          accent
          className="mb-3 text-center text-3xl text-gray-900 md:text-4xl"
          style={instrument}
        />
        <RichText
          as="p"
          value={quickLinks.intro}
          className="mx-auto mb-12 max-w-2xl text-center text-sm leading-relaxed text-gray-600"
          style={instrument}
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((link, index) => {
            const body = (
              <>
                <div>
                  <h4 className="mb-1 text-base text-gray-900" style={instrument}>
                    {link.title}
                  </h4>
                  <RichText as="p" value={link.desc} className="text-sm text-gray-500" style={instrument} />
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0 text-brand transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  aria-hidden
                >
                  <path d="M7 17L17 7" />
                  <path d="M8 7h9v9" />
                </svg>
              </>
            );
            const className =
              "group flex items-center justify-between border border-brand-soft border-t-4 rounded-2xl px-6 py-5 bg-gradient-to-br from-brand-wash to-brand-muted shadow-sm shadow-brand-soft/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand/25";
            const style = { borderTopColor: resolveSiteAccentColor(link.accent) };

            if (link.to) {
              return (
                <Link key={`${link.title}-${index}`} to={link.to} className={className} style={style}>
                  {body}
                </Link>
              );
            }
            const isExternal = /^https?:/i.test(safeHref(link.href));
            const href = safeHref(link.href);
            if (!href) return null;
            return (
              <a
                key={`${link.title}-${index}`}
                href={href}
                className={className}
                style={style}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {body}
              </a>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
}

const HomePage = () => {
  const content = usePageContent("home");
  return (
    <div className="w-full min-w-0 bg-gradient-to-r from-brand-page-from via-brand-page-via to-brand-page-to">
      <HeroVideo hero={content.hero ?? {}} />
      <SloganBand slogan={content.slogan ?? {}} />
      <HowApoyoFits howFits={content.howFits ?? {}} />
      <LivingShowcase showcase={content.showcase ?? {}} />
      <DownloadApp download={content.download ?? {}} />
      <PhoneShowcase phones={content.phones ?? {}} />
      <QuickLinks quickLinks={content.quickLinks ?? {}} />
    </div>
  );
};

export default HomePage;
