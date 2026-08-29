import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ScrollReveal from "../shared/ui/ScrollReveal";
import { instrument } from "../shared/lib/fonts";
import { usePageContent } from "../shared/content/WebContentContext";
import { RichText, plainText } from "../shared/content/richText";
import ContentImage from "../shared/ui/ContentImage";
import {
  ensurePublicCatalog,
  htmlToPlainText,
  readCachedPublicCatalog,
} from "../shared/lib/publicCatalog";
import { isLegacySiteBrandHex } from "../shared/lib/webTheme";
import { safeHref } from "../shared/lib/safeHref";

/* Page chrome is fixed in the app; CMS only stores per-category presentation overlays. */
const SERVICES_UI = {
  hero: {
    kicker: "City of Dasmariñas, Cavite",
    heading: "Services",
    subtitle: "Apoyo offers application support for these social welfare benefits.",
    badge: "Available Services",
    panelHeading: "Choose a category to view service details and requirements",
    panelCopy: "Select any card below to open facility photos, programs, and the documents you need to prepare.",
    statCategoriesLabel: "Categories",
    statProgramsLabel: "Programs",
    statRequirementsLabel: "With requirements",
  },
  gridHint: "Tap a category card to open facility photos, programs, and requirements.",
  detailStrings: {
    backButton: "← Back to Services",
    servicesHeading: "Services",
    requirementsLabel: "Requirements",
    importantDetailsHeading: "Important details",
    modalKicker: "Visit & location",
    modalCta: "Official Facebook page",
    mapKicker: "How to get there",
    mapAttribution: "Map © OpenStreetMap contributors",
    directionsButton: "Directions in Google Maps",
    openMapsButton: "Open in Google Maps",
  },
};

/* Per-category visual treatment (gradients/accents) when theme_json is absent. */
const CATEGORY_THEME = {
  medical: {
    gradient: "linear-gradient(to right, #008B88 23%, #06C1EC 78%)",
    accentTint: "rgba(6,193,236,0.08)",
    accentBorder: "rgba(0,139,136,0.35)",
    accentText: "#008B88",
    glow: "bg-cyan-300/40",
    hover: "translate-x-1 bg-gradient-to-r from-[#e8f8fb] to-[#effcfd] shadow-sm",
    expanded: "bg-[#e8f8fb] rounded-2xl px-3 -mx-3 shadow-[0_12px_30px_-24px_rgba(0,139,136,0.18)]",
  },
  financial: {
    gradient: "linear-gradient(to right, #008B88 0%, #9ACD32 45%, #FFD700 100%)",
    accentTint: "rgba(154,205,50,0.12)",
    accentBorder: "rgba(0,139,136,0.3)",
    accentText: "#008B88",
    glow: "bg-lime-300/40",
    hover: "translate-x-1 bg-gradient-to-r from-[#fdfbf0] to-[#fffdf5] shadow-sm",
    expanded: "bg-[#fdfbf0] rounded-2xl px-3 -mx-3 shadow-[0_12px_30px_-24px_rgba(200,168,0,0.18)]",
  },
  burial: {
    gradient: "linear-gradient(to right, #008B8B 0%, #4169E1 40%, #7B61FF 70%, #BF40BF 100%)",
    accentTint: "rgba(123,97,255,0.1)",
    accentBorder: "rgba(65,105,225,0.35)",
    accentText: "#7B61FF",
    glow: "bg-violet-300/40",
    hover: "translate-x-1 bg-gradient-to-r from-[#f7f4ff] to-[#faf8ff] shadow-sm",
    expanded: "bg-[#f7f4ff] rounded-2xl px-3 -mx-3 shadow-[0_12px_30px_-24px_rgba(91,81,200,0.18)]",
  },
};
const DEFAULT_THEME = {
  gradient: "linear-gradient(to right, var(--web-primary), var(--web-accent))",
  accentTint: "rgba(var(--web-primary-rgb), 0.1)",
  accentBorder: "rgba(var(--web-primary-rgb), 0.35)",
  accentText: "var(--web-primary)",
  glow: "bg-brand/40",
  hover: "translate-x-1 bg-gradient-to-r from-brand-wash to-brand-soft shadow-sm",
  expanded:
    "bg-brand-wash rounded-2xl px-3 -mx-3 shadow-[0_12px_30px_-24px_rgba(var(--web-primary-rgb),0.35)]",
};

function hexToRgba(hex, alpha) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return `rgba(var(--web-primary-rgb),${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function resolveCategoryColor(value, fallback) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (isLegacySiteBrandHex(raw)) return fallback;
  return raw;
}

function themeFromCatalog(slug, themeJson) {
  const base = CATEGORY_THEME[slug] ?? DEFAULT_THEME;
  let obj =
    themeJson && typeof themeJson === "object" && !Array.isArray(themeJson) ? themeJson : null;
  if (!obj && typeof themeJson === "string") {
    try {
      const parsed = JSON.parse(themeJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) obj = parsed;
    } catch {
      /* ignore */
    }
  }
  const stripeRaw =
    (Array.isArray(obj?.homeCardStripeGradient) && obj.homeCardStripeGradient) ||
    (Array.isArray(obj?.home_card_stripe_gradient) && obj.home_card_stripe_gradient) ||
    null;
  const stripe = Array.isArray(stripeRaw)
    ? stripeRaw.map((stop) => resolveCategoryColor(stop, "var(--web-primary)"))
    : null;
  const accent = resolveCategoryColor(
    (typeof obj?.primary === "string" && obj.primary) ||
      (typeof obj?.accent === "string" && obj.accent) ||
      (Array.isArray(stripe) && stripe[0]) ||
      "",
    base.accentText
  );

  if (Array.isArray(stripe) && stripe.length >= 2) {
  return {
      ...base,
      gradient: `linear-gradient(to right, ${stripe.join(", ")})`,
      accentText: accent,
      accentTint: hexToRgba(accent, 0.1),
      accentBorder: hexToRgba(accent, 0.35),
    };
  }

  if (accent && accent !== base.accentText) {
    return {
      ...base,
      gradient: `linear-gradient(to right, ${accent}, ${accent})`,
      accentText: accent,
      accentTint: hexToRgba(accent, 0.1),
      accentBorder: hexToRgba(accent, 0.35),
    };
  }

  return base;
}

function formatCategoryTitle(name) {
  const raw = String(name || "").trim();
  if (!raw) return "Assistance";
  if (/assistance$/i.test(raw)) return raw;
  return `${raw} Assistance`;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildCategoryCard(catalogCategory, presentation = {}) {
  const slug = String(catalogCategory.slug || "").trim();
  const theme = themeFromCatalog(slug, catalogCategory.theme_json);
  const title = formatCategoryTitle(catalogCategory.assistance_name);
  const desc = catalogCategory.description || "";
  const programs = Array.isArray(catalogCategory.assistance_services)
    ? catalogCategory.assistance_services
    : [];

  const locationLabel = presentation.locationLabel || title;
  const facilityTitle = presentation.locationLabel || title;

  return {
    id: slug,
    title,
    desc,
    gradient: theme.gradient,
    accentTint: theme.accentTint,
    accentBorder: theme.accentBorder,
    accentText: theme.accentText,
    glow: theme.glow,
    hover: theme.hover,
    expanded: theme.expanded,
    facilityTitle,
    facilityTagline: "",
    infoLink: presentation.infoLink || "",
    infoLabel: presentation.infoLabel || "Visit & location",
    detailNote: desc,
    location: {
      label: locationLabel,
      address: presentation.locationAddress || "",
      lat: toNumberOrNull(presentation.lat),
      lng: toNumberOrNull(presentation.lng),
    },
    imagesSide: presentation.imagesSide || "left",
    images: [presentation.imageMain, presentation.imageSub1, presentation.imageSub2]
      .map((src) => String(src || "").trim())
      .filter(Boolean)
      .slice(0, 3),
    highlights: [],
    services: programs.map((svc) => {
      const rawWho = svc.who_bullets;
      const whoBullets = Array.isArray(rawWho)
        ? rawWho.map((b) => String(b ?? "").trim()).filter(Boolean)
        : String(rawWho ?? "")
            .split(/\n+/)
            .map((b) => b.trim())
            .filter(Boolean);
      return {
        label: svc.display_name || "",
        icon: svc.mobile_image_url || "",
        description: htmlToPlainText(svc.description_html),
        about: htmlToPlainText(svc.about_html),
        reminder: String(svc.reminder_text ?? "").trim(),
        whoBullets,
        requirements: (svc.assistance_requirements ?? []).map((req) => ({
          id: req.id,
          title: String(req.title ?? "").trim(),
          help: String(req.help ?? "").trim(),
          sampleDocumentImage: req.sampleDocumentImage || "",
          sampleDocumentName: req.sampleDocumentName || "",
          tips: Array.isArray(req.tips)
            ? req.tips
                .map((tip) => ({
                  id: tip.id,
                  title: String(tip.title ?? "").trim(),
                  description: String(tip.description ?? "").trim(),
                }))
                .filter((tip) => tip.title || tip.description)
            : [],
        })),
      };
    }),
  };
}

function openStreetMapEmbedUrl(lat, lng, pad = 0.022) {
  const west = lng - pad;
  const south = lat - pad * 0.85;
  const east = lng + pad;
  const north = lat + pad * 0.85;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    `${west},${south},${east},${north}`
  )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

function FacilityLocationMap({ data, strings, variant = "default" }) {
  const location = data.location;
  if (!location?.lat || !location?.lng) return null;

  const embedSrc = openStreetMapEmbedUrl(location.lat, location.lng);
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${plainText(location.label)}, ${plainText(location.address)}`
  )}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
  const wrapClass =
    variant === "nested" ? "space-y-3" : "mt-4 border-t border-gray-200/80 pt-4";

  return (
    <div className={wrapClass}>
      <p
        className="mb-2 text-[11px] uppercase tracking-[0.14em] text-gray-500"
        style={{ ...instrument, fontWeight: 600 }}
      >
        {strings.mapKicker}
      </p>
      <RichText
        as="p"
        value={location.address}
        className="mb-3 text-[12px] leading-snug text-gray-600"
        style={{ ...instrument, fontWeight: 500 }}
      />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-inner">
        <iframe
          title={plainText(location.label)}
          src={embedSrc}
          className="h-[220px] w-full border-0 sm:h-[260px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      {strings.mapAttribution ? (
        <p className="mt-2 text-[10px] leading-relaxed text-gray-400">{strings.mapAttribution}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border bg-white px-4 py-2.5 text-center text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 sm:min-w-0 sm:flex-initial"
          style={{ ...instrument, borderColor: data.accentBorder, color: data.accentText }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 opacity-90"
            aria-hidden
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          {strings.directionsButton}
        </a>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-center text-xs text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 sm:min-w-0 sm:flex-initial"
          style={{ ...instrument, fontWeight: 500 }}
        >
          {strings.openMapsButton}
          <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}

function VisitModalPanel({ data, strings }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const scroller = document.getElementById("app-scroll");
    const prevOverflow = scroller?.style.overflow ?? "";
    if (scroller) scroller.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (scroller) scroller.style.overflow = prevOverflow;
    };
  }, [open]);

  const modal = open
    ? createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`visit-modal-title-${data.id}`}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity"
            aria-label="Close dialog"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex max-h-[min(92vh,840px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)]">
            <div
              className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4"
              style={{ background: "linear-gradient(180deg, var(--web-wash) 0%, #fff 100%)" }}
            >
              <div className="min-w-0">
                <p
                  className="text-[10px] uppercase tracking-[0.16em] text-gray-400"
                  style={{ ...instrument, fontWeight: 600 }}
                >
                  {strings.modalKicker}
                </p>
                <h2
                  id={`visit-modal-title-${data.id}`}
                  className="mt-1 text-base font-semibold leading-snug text-gray-900 sm:text-lg"
                  style={{ ...instrument, fontWeight: 600 }}
                >
                  {data.infoLabel}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <div className="space-y-5">
                <RichText
                  as="p"
                  value={data.detailNote}
                  className="text-[13px] leading-relaxed text-gray-600"
                  style={{ ...instrument, fontWeight: 400 }}
                />
                {safeHref(data.infoLink) ? (
                  <a
                    href={safeHref(data.infoLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border bg-white px-4 py-2.5 text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 sm:w-auto"
                    style={{
                      ...instrument,
                      fontWeight: 500,
                      borderColor: data.accentBorder,
                      color: data.accentText,
                    }}
                  >
                    {strings.modalCta}
                    <span aria-hidden>↗</span>
                  </a>
                ) : null}
                <FacilityLocationMap data={data} strings={strings} variant="nested" />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border bg-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-all duration-300 hover:-translate-y-0.5 sm:w-auto"
        style={{ ...instrument, fontWeight: 600, borderColor: data.accentBorder, color: data.accentText }}
      >
        {data.infoLabel}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-80"
          aria-hidden
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </button>
      {modal}
    </>
  );
}

function ServiceImageBlock({ data }) {
  const [hovered, setHovered] = useState(null);
  const images = Array.isArray(data.images) ? data.images.filter(Boolean).slice(0, 3) : [];
  if (!images.length) return null;

  const [main, sub1, sub2] = images;
  const hoverClass = (key) =>
    hovered === key ? "scale-105 brightness-105" : "scale-100 brightness-100";

  // One image — full hero frame (previous "one" layout).
  if (images.length === 1) {
    return (
      <div
        className="w-full overflow-hidden rounded-3xl shadow-lg transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.25)]"
        onMouseEnter={() => setHovered("main")}
        onMouseLeave={() => setHovered(null)}
      >
        <img
          src={main}
          alt={plainText(data.facilityTitle)}
          className={`h-[220px] min-h-[200px] w-full object-cover object-center transition-all duration-700 ease-out sm:h-[320px] md:h-[380px] lg:h-[420px] ${hoverClass(
            "main"
          )}`}
        />
      </div>
    );
  }

  // Two images — main on top, second full-width below.
  if (images.length === 2) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className="w-full cursor-pointer overflow-hidden rounded-3xl shadow-lg transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.25)]"
          onMouseEnter={() => setHovered("main")}
          onMouseLeave={() => setHovered(null)}
        >
          <img
            src={main}
            alt={plainText(data.facilityTitle)}
            className={`h-[200px] min-h-[160px] w-full object-cover object-center transition-all duration-700 ease-out sm:h-[260px] md:h-[300px] ${hoverClass(
              "main"
            )}`}
          />
        </div>
        <div
          className="cursor-pointer overflow-hidden rounded-3xl shadow-md transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)]"
          onMouseEnter={() => setHovered("sub1")}
          onMouseLeave={() => setHovered(null)}
        >
          <img
            src={sub1}
            alt=""
            className={`h-[140px] w-full object-cover object-center transition-all duration-700 ease-out sm:h-[180px] md:h-[200px] ${hoverClass(
              "sub1"
            )}`}
          />
        </div>
      </div>
    );
  }

  // Three images — previous stacked collage (main + two below).
  return (
    <div className="flex flex-col gap-4">
      <div
        className="w-full cursor-pointer overflow-hidden rounded-3xl shadow-lg transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.25)]"
        onMouseEnter={() => setHovered("main")}
        onMouseLeave={() => setHovered(null)}
      >
        <img
          src={main}
          alt={plainText(data.facilityTitle)}
          className={`h-[200px] min-h-[160px] w-full object-cover object-center transition-all duration-700 ease-out sm:h-[260px] md:h-[300px] ${hoverClass(
              "main"
            )}`}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="cursor-pointer overflow-hidden rounded-3xl shadow-md transition-all duration-500 ease-out hover:scale-[1.03] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)]"
            onMouseEnter={() => setHovered("sub1")}
            onMouseLeave={() => setHovered(null)}
          >
            <img
            src={sub1}
              alt=""
            className={`h-[140px] w-full object-cover object-center transition-all duration-700 ease-out sm:h-[180px] md:h-[200px] ${hoverClass(
                "sub1"
              )}`}
            />
          </div>
          <div
            className="cursor-pointer overflow-hidden rounded-3xl shadow-md transition-all duration-500 ease-out hover:scale-[1.03] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)]"
            onMouseEnter={() => setHovered("sub2")}
            onMouseLeave={() => setHovered(null)}
          >
            <img
            src={sub2}
              alt=""
            className={`h-[140px] w-full object-cover object-center transition-all duration-700 ease-out sm:h-[180px] md:h-[200px] ${hoverClass(
                "sub2"
              )}`}
            />
          </div>
        </div>
      </div>
    );
  }

function AccordionChevron({ open, color }) {
  return (
    <span
      className="inline-block shrink-0 text-base font-bold leading-none transition-transform duration-300"
      style={{
        color: open ? color : undefined,
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
      }}
      aria-hidden
    >
      ↗
    </span>
  );
}

function AccordionRow({
  id,
  title,
  open,
  onToggle,
  accentText,
  children,
  meta,
  level = 1,
}) {
  const pad = level === 1 ? "px-3 py-2.5" : level === 2 ? "px-2.5 py-2" : "px-2 py-1.5";
  const titleSize = level === 1 ? "text-[13px]" : "text-[12.5px]";
  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        level === 1 ? "border-gray-100 bg-white/95 shadow-sm" : "border-gray-100/90 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className={`flex w-full items-center justify-between gap-3 text-left transition hover:bg-gray-50/80 ${pad}`}
      >
        <span className="min-w-0 flex-1">
          <span
            className={`block font-semibold text-gray-900 ${titleSize}`}
            style={{ ...instrument, fontWeight: 600 }}
          >
            {title}
          </span>
          {meta && !open ? (
            <span className="mt-0.5 block truncate text-[11px] text-gray-500" style={instrument}>
              {meta}
            </span>
          ) : null}
        </span>
        <AccordionChevron open={open} color={accentText} />
      </button>
      <div
        id={id}
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.35s ease",
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`border-t border-gray-100 ${level === 1 ? "px-3 py-3" : "px-2.5 py-2.5"}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramDetailLayers({ service, serviceKey, accentText, requirementsLabel }) {
  const [openSection, setOpenSection] = useState(null);
  const [openRequirements, setOpenRequirements] = useState(() => new Set());
  const [openTips, setOpenTips] = useState(() => new Set());
  const [openSamples, setOpenSamples] = useState(() => new Set());

  useEffect(() => {
    setOpenSection(null);
    setOpenRequirements(new Set());
    setOpenTips(new Set());
    setOpenSamples(new Set());
  }, [serviceKey]);

  const toggleSection = (section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const toggleRequirement = (reqId) => {
    setOpenRequirements((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) {
        next.delete(reqId);
        setOpenSamples((samples) => {
          const cleaned = new Set(samples);
          cleaned.delete(reqId);
          return cleaned;
        });
      } else {
        next.add(reqId);
      }
      return next;
    });
  };

  const toggleTip = (tipId) => {
    setOpenTips((prev) => {
      const next = new Set(prev);
      if (next.has(tipId)) next.delete(tipId);
      else next.add(tipId);
      return next;
    });
  };

  const toggleSample = (reqId) => {
    setOpenSamples((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId);
      else next.add(reqId);
      return next;
    });
  };

  const reqCount = service.requirements?.length ?? 0;

  return (
    <div className="space-y-2.5 pb-5 pl-0.5">
      {service.description ? (
        <RichText
          as="p"
          value={service.description}
          className="text-[13px] leading-relaxed text-gray-600"
          style={instrument}
        />
      ) : null}

      <div className="space-y-2">
        {service.about ? (
          <AccordionRow
            id={`${serviceKey}-about`}
            title="About this program"
            open={openSection === "about"}
            onToggle={() => toggleSection("about")}
            accentText={accentText}
            meta="Overview"
          >
            <RichText
              as="p"
              value={service.about}
              className="text-[13px] leading-relaxed text-gray-700"
              style={instrument}
            />
          </AccordionRow>
        ) : null}

        {service.whoBullets?.length ? (
          <AccordionRow
            id={`${serviceKey}-who`}
            title="Who it serves"
            open={openSection === "who"}
            onToggle={() => toggleSection("who")}
            accentText={accentText}
            meta={`${service.whoBullets.length} detail${service.whoBullets.length === 1 ? "" : "s"}`}
          >
            <ul className="space-y-2">
              {service.whoBullets.map((item, whoIndex) => (
                <li
                  key={whoIndex}
                  className="flex gap-2 text-[13px] leading-relaxed text-gray-700"
                  style={instrument}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: accentText }}
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </AccordionRow>
        ) : null}

        {service.reminder ? (
          <AccordionRow
            id={`${serviceKey}-reminder`}
            title="Reminder"
            open={openSection === "reminder"}
            onToggle={() => toggleSection("reminder")}
            accentText={accentText}
            meta="Important note"
          >
            <div className="rounded-lg border border-rose-100 bg-rose-50/80 px-3 py-2.5">
              <p className="text-[13px] leading-relaxed text-rose-800/90" style={instrument}>
                {service.reminder}
              </p>
            </div>
          </AccordionRow>
        ) : null}

        {reqCount > 0 ? (
          <AccordionRow
            id={`${serviceKey}-requirements`}
            title={requirementsLabel}
            open={openSection === "requirements"}
            onToggle={() => toggleSection("requirements")}
            accentText={accentText}
            meta={`${reqCount} document${reqCount === 1 ? "" : "s"}`}
          >
            <div className="space-y-2">
              {service.requirements.map((req, reqIndex) => {
                const reqId = req.id || `req-${reqIndex}`;
                const reqOpen = openRequirements.has(reqId);
                const tipCount = req.tips?.length ?? 0;
                const hasNested = Boolean(req.help) || tipCount > 0 || Boolean(req.sampleDocumentImage);
                const title = req.title || `Requirement ${reqIndex + 1}`;

                if (!hasNested) {
                  return (
                    <div
                      key={reqId}
                      className="rounded-xl border border-gray-100 bg-gray-50/80 px-2.5 py-2 text-[12.5px] font-semibold text-gray-800"
                      style={{ ...instrument, fontWeight: 600 }}
                    >
                      {title}
                    </div>
                  );
                }

                return (
                  <AccordionRow
                    key={reqId}
                    id={`${serviceKey}-${reqId}`}
                    title={title}
                    open={reqOpen}
                    onToggle={() => toggleRequirement(reqId)}
                    accentText={accentText}
                    level={2}
                    meta={
                      [
                        tipCount ? `${tipCount} tip${tipCount === 1 ? "" : "s"}` : null,
                        req.sampleDocumentImage ? "sample" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Details"
                    }
                  >
                    <div className="space-y-2">
                      {req.help ? (
                        <p className="text-[12.5px] leading-relaxed text-gray-600" style={instrument}>
                          {req.help}
                        </p>
                      ) : null}

                      {tipCount > 0 ? (
                        <div className="space-y-1.5">
                          <p
                            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400"
                            style={instrument}
                          >
                            Tips
                          </p>
                          {req.tips.map((tip, tipIndex) => {
                            const tipId = tip.id || `${reqId}-tip-${tipIndex}`;
                            const tipTitle = tip.title || `Tip ${tipIndex + 1}`;
                            if (!tip.description) {
                              return (
                                <div
                                  key={tipId}
                                  className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 text-[12px] font-semibold text-gray-800"
                                  style={{ ...instrument, fontWeight: 600 }}
                                >
                                  {tipTitle}
                                </div>
                              );
                            }
                            return (
                              <AccordionRow
                                key={tipId}
                                id={`${serviceKey}-${tipId}`}
                                title={tipTitle}
                                open={openTips.has(tipId)}
                                onToggle={() => toggleTip(tipId)}
                                accentText={accentText}
                                level={3}
                                meta="Tap for details"
                              >
                                <p
                                  className="text-[12px] leading-relaxed text-gray-600"
                                  style={instrument}
                                >
                                  {tip.description}
                                </p>
                              </AccordionRow>
                            );
                          })}
                        </div>
                      ) : null}

                      {req.sampleDocumentImage ? (
                        <AccordionRow
                          id={`${serviceKey}-${reqId}-sample`}
                          title="Sample document"
                          open={openSamples.has(reqId)}
                          onToggle={() => toggleSample(reqId)}
                          accentText={accentText}
                          level={3}
                          meta={req.sampleDocumentName || "Preview"}
                        >
                          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                            <img
                              src={req.sampleDocumentImage}
                              alt={
                                req.sampleDocumentName
                                  ? `Sample: ${req.sampleDocumentName}`
                                  : `Sample for ${title}`
                              }
                              className="mx-auto max-h-48 w-full object-contain p-2"
                              loading="lazy"
                            />
                            {req.sampleDocumentName ? (
                              <p className="border-t border-gray-100 px-2 py-1 text-center text-[10px] text-gray-500">
                                {req.sampleDocumentName}
                              </p>
                            ) : null}
                          </div>
                        </AccordionRow>
                      ) : null}
                    </div>
                  </AccordionRow>
                );
              })}
            </div>
          </AccordionRow>
        ) : null}
      </div>
    </div>
  );
}

function ServiceDetailPanel({ data, strings, expandedService, setExpandedService }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <h2
        className={`text-3xl leading-tight sm:text-4xl md:text-5xl ${
          data.facilityTagline ? "mb-2" : "mb-5"
        }`}
        style={{
          fontFamily: "'Instrument Sans', sans-serif",
          fontWeight: 600,
          background: data.gradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {data.title}
      </h2>
      {data.facilityTagline ? (
        <p
          className="mb-6 text-[13px] text-gray-500"
          style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 500 }}
        >
          {data.facilityTagline}
        </p>
      ) : null}
      <RichText
        as="p"
        value={data.desc}
        className="mb-8 text-[15px] leading-relaxed text-gray-700"
        style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 400 }}
      />

      <div
        className="mb-7 rounded-2xl border p-4"
        style={{ borderColor: data.accentBorder, background: data.accentTint }}
      >
        {data.infoLink || (data.location?.lat && data.location?.lng) ? (
        <VisitModalPanel data={data} strings={strings} />
        ) : (
          <p className="text-xs text-gray-500" style={instrument}>
            Location and visit details will appear here once published in Web CMS.
          </p>
        )}
      </div>

      {data.highlights.length > 0 ? (
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-sm">
          <p
            className="mb-3 text-[11px] uppercase tracking-[0.14em] text-gray-500"
            style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 500 }}
          >
            {strings.importantDetailsHeading}
          </p>
          <ul className="space-y-2.5">
            {data.highlights.map((item, index) => (
              <li
                key={index}
                className="flex gap-2 text-[13px] leading-relaxed text-gray-700"
                style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 400 }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: data.accentText }}
                  aria-hidden
                />
                <RichText as="span" value={item} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <h3
        className="mb-4 text-xl text-gray-900"
        style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600 }}
      >
        {strings.servicesHeading}
      </h3>
      <div className="flex flex-col gap-1">
        {data.services.map((service, index) => {
          const key = `${data.id}-detail-${index}`;
          const isOpen = expandedService === key;
          const hasDetail =
            service.requirements.length > 0 ||
            Boolean(service.description) ||
            Boolean(service.about) ||
            Boolean(service.reminder) ||
            (service.whoBullets?.length ?? 0) > 0;
          return (
            <div
              key={key}
              className={`border-b border-gray-100 transition-all duration-300 ${
                isOpen ? data.expanded : ""
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (hasDetail) setExpandedService(isOpen ? null : key);
                }}
                className={`group flex w-full items-center justify-between py-3 text-left transition-all duration-200 select-none ${
                  hasDetail ? "cursor-pointer hover:pl-2 active:scale-[0.98]" : "cursor-default"
                }`}
                style={hasDetail ? { "--svc-accent": data.accentText } : undefined}
                aria-expanded={isOpen}
              >
                <span
                  className={`text-[15px] transition-all duration-200 ${
                    isOpen ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
                  }`}
                  style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontWeight: isOpen ? 600 : 400,
                  }}
                >
                  {service.label}
                </span>
                {hasDetail ? (
                  <span
                    className={`inline-block text-lg font-bold text-gray-400 transition-all duration-300 ease-in-out group-hover:[color:var(--svc-accent)]`}
                    style={{
                      color: isOpen ? data.accentText : undefined,
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  >
                    ↗
                  </span>
                ) : (
                  <span className="text-lg text-gray-400">↗</span>
                )}
              </button>
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.4s ease",
                }}
              >
                <div className="min-h-0 overflow-hidden">
                  {isOpen ? (
                    <ProgramDetailLayers
                      service={service}
                      serviceKey={key}
                      accentText={data.accentText}
                      requirementsLabel={strings.requirementsLabel}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceDetailView({ data, strings, expandedService, setExpandedService, onBack }) {
  return (
    <ScrollReveal
      as="section"
      className="w-full overflow-hidden bg-gradient-to-r from-brand-page-from/50 via-white to-brand-page-to/50 px-4 pb-24 pt-6"
      delay={40}
    >
      <div className="mx-auto max-w-[1100px]">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white px-4 py-2 text-sm text-brand shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40"
          style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 500 }}
        >
          {strings.backButton}
        </button>

        {data.imagesSide === "left" ? (
          <>
            <h2
              className="mb-6 break-words text-3xl leading-tight sm:text-4xl md:mb-10 md:text-5xl"
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontWeight: 600,
                background: data.gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {data.facilityTitle}
            </h2>
            <div className="flex flex-col items-start gap-6 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_28px_70px_-45px_rgba(var(--web-primary-rgb),0.35)] backdrop-blur-sm sm:p-5 md:flex-row md:gap-10 md:p-8">
              <div className="w-full min-w-0 flex-1">
                <ServiceImageBlock data={data} />
              </div>
              <ServiceDetailPanel
                data={data}
                strings={strings}
                expandedService={expandedService}
                setExpandedService={setExpandedService}
              />
            </div>
          </>
        ) : null}

        {data.imagesSide === "right" ? (
          <div className="flex flex-col items-start gap-6 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_28px_70px_-45px_rgba(var(--web-primary-rgb),0.35)] backdrop-blur-sm sm:p-5 md:flex-row md:gap-10 md:p-8">
            <ServiceDetailPanel
              data={data}
              strings={strings}
              expandedService={expandedService}
              setExpandedService={setExpandedService}
            />
            <div className="flex w-full min-w-0 flex-1 flex-col">
              <h2
                className="mb-5 break-words whitespace-pre-line text-3xl leading-tight sm:text-4xl md:mb-6 md:text-5xl"
                style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontWeight: 600,
                  background: data.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {data.facilityTitle}
              </h2>
              <ServiceImageBlock data={data} />
            </div>
          </div>
        ) : null}
      </div>
    </ScrollReveal>
  );
}

function ServicesHero({ hero, stats }) {
  return (
    <ScrollReveal
      as="section"
      className="relative overflow-hidden px-4 pb-10 pt-14 md:pt-16"
      rootMargin="0px 0px 0px 0px"
    >
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="relative mx-auto max-w-5xl text-center">
        {hero.logo ? <ContentImage src={hero.logo} alt="" slot="logoPage" /> : null}
        <p
          className="mb-3 text-xs uppercase tracking-[0.2em] text-brand"
          style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600 }}
        >
          {hero.kicker}
        </p>
        <RichText
          as="h1"
          value={hero.heading}
          className="mb-4 text-3xl leading-tight text-gray-900 md:text-4xl"
          style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600 }}
        />
        <RichText
          as="p"
          value={hero.subtitle}
          className="mx-auto max-w-xl text-base text-gray-600"
          style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 500 }}
        />

        <div className="mx-auto mt-8 w-full max-w-4xl rounded-3xl border border-brand/10 bg-white/80 p-5 shadow-[0_20px_50px_-35px_rgba(var(--web-primary-rgb),0.45)] backdrop-blur-sm md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-left">
              {hero.badge ? (
                <p
                  className="mb-3 inline-flex items-center rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs uppercase tracking-[0.15em] text-brand"
                  style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600 }}
                >
                  {hero.badge}
                </p>
              ) : null}
              <RichText
                as="h2"
                value={hero.panelHeading}
                className="text-xl text-gray-900 md:text-2xl"
                style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 500 }}
              />
              <RichText
                as="p"
                value={hero.panelCopy}
                className="mt-2 text-sm text-gray-600"
                style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 400 }}
              />
            </div>
            <div className="grid w-full grid-cols-2 gap-3 md:w-auto md:min-w-[220px]">
              <div className="rounded-2xl border border-gray-100 bg-white p-3 text-left">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  {hero.statCategoriesLabel}
                </p>
                <p
                  className="text-2xl text-gray-900"
                  style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700 }}
                >
                  {stats.categoryCount}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-3 text-left">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  {hero.statProgramsLabel}
                </p>
                <p
                  className="text-2xl text-gray-900"
                  style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700 }}
                >
                  {stats.programCount}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl border border-brand/15 bg-brand-wash p-3 text-left">
                <p className="text-[11px] uppercase tracking-wide text-brand/70">
                  {hero.statRequirementsLabel}
                </p>
                <p
                  className="text-xl text-brand-ink"
                  style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700 }}
                >
                  {stats.withRequirementsCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

function ServicesCategoryGrid({
  cards,
  hint,
  hoveredService,
  setHoveredService,
  clickedCard,
  onCardClick,
}) {
  return (
    <ScrollReveal
      as="section"
      id="services-grid"
      className="w-full overflow-hidden bg-gradient-to-r from-brand-page-from/40 via-white/60 to-brand-page-to/40 px-4 pb-24 pt-10"
      delay={60}
    >
      <div className="mx-auto mb-8 max-w-[1100px]">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 px-5 py-4 shadow-[0_18px_45px_-30px_rgba(var(--web-primary-rgb),0.4)] backdrop-blur-md">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-brand-highlight/20 blur-2xl" />
          <RichText
            as="p"
            value={hint}
            className="relative text-sm text-gray-600"
            style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 500 }}
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1100px] items-start gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onCardClick(card.id)}
            className={`group relative flex w-full flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 text-left shadow-[0_24px_50px_-36px_rgba(15,23,42,0.4)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_60px_-36px_rgba(var(--web-primary-rgb),0.28)] ${
              clickedCard === card.id ? "scale-[0.97] opacity-90" : ""
            }`}
            style={{
              transform: clickedCard === card.id ? "translateX(-12px) scale(0.97)" : undefined,
            }}
          >
            <div
              className={`pointer-events-none absolute -right-10 -top-16 h-28 w-28 rounded-full blur-2xl ${card.glow}`}
            />
            <h3
              className="relative mb-3 text-2xl leading-tight"
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontWeight: 700,
                background: card.gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {card.title}
            </h3>
            <RichText
              as="p"
              value={card.desc}
              className="relative mb-6 text-sm leading-relaxed text-gray-600"
              style={instrument}
            />
            <ul className="relative space-y-3">
              {card.services.map((service, index) => {
                const key = `${card.id}-${index}`;
                const isHovered = hoveredService === key;
                return (
                  <li
                    key={key}
                    onMouseEnter={() => setHoveredService(key)}
                    onMouseLeave={() => setHoveredService(null)}
                    className={`flex items-start gap-4 rounded-2xl p-3 transition-all duration-300 ease-out ${
                      isHovered ? card.hover : ""
                    }`}
                  >
                    {service.icon ? (
                      <ContentImage
                        src={service.icon}
                        alt=""
                        slot="icon"
                        imgClassName={`shrink-0 transition-all duration-500 ease-out ${
                          isHovered ? "scale-110" : "scale-100"
                        }`}
                      />
                    ) : null}
                    <div className="min-w-0 pt-1">
                      <p
                        className="text-sm font-semibold text-gray-900"
                        style={{ ...instrument, fontWeight: 600 }}
                      >
                        {service.label}
                      </p>
                      <RichText
                        as="p"
                        value={service.description}
                        className="mt-1 text-xs leading-relaxed text-gray-500"
                        style={instrument}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="relative mt-6 h-1.5 overflow-hidden rounded-full bg-gray-100" aria-hidden>
              <div
                className="h-full w-full origin-left transition-transform duration-500 group-hover:scale-x-100"
                style={{ background: card.gradient, transform: "scaleX(0.35)" }}
              />
            </div>
          </button>
        ))}
      </div>
    </ScrollReveal>
  );
}

const ServicesPage = () => {
  const content = usePageContent("services");
  const homeHero = usePageContent("home").hero ?? {};
  const hero = useMemo(
    () => ({
      ...SERVICES_UI.hero,
      ...(content.hero ?? {}),
      logo: content.hero?.logo || homeHero.logo || "",
    }),
    [content.hero, homeHero.logo]
  );
  const strings = SERVICES_UI.detailStrings;
  const hint = SERVICES_UI.gridHint;

  const [cachedCatalog] = useState(() => readCachedPublicCatalog());
  const [catalog, setCatalog] = useState(() => cachedCatalog ?? []);
  const [catalogStatus, setCatalogStatus] = useState(() => (cachedCatalog ? "ready" : "loading"));
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await ensurePublicCatalog();
        if (cancelled) return;
        setCatalog((prev) => (JSON.stringify(prev) === JSON.stringify(rows) ? prev : rows));
        setCatalogError("");
        setCatalogStatus("ready");
      } catch (ex) {
        if (cancelled) return;
        if (cachedCatalog) return;
        setCatalog([]);
        setCatalogError(ex?.message || "Failed to load assistance catalog.");
        setCatalogStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // cachedCatalog is a mount snapshot for fallback-on-error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presentationsBySlug = useMemo(() => {
    const map = new Map();
    const rows = Array.isArray(content.presentations)
      ? content.presentations
      : Array.isArray(content.categories)
        ? content.categories
        : [];
    for (const row of rows) {
      const slug = String(row?.catalogSlug ?? row?.id ?? "").trim();
      if (slug) map.set(slug, row);
    }
    return map;
  }, [content.presentations, content.categories]);

  const cards = useMemo(
    () => catalog.map((cat) => buildCategoryCard(cat, presentationsBySlug.get(cat.slug) ?? {})),
    [catalog, presentationsBySlug]
  );

  const [activeCard, setActiveCard] = useState(null);
  const [expandedService, setExpandedService] = useState(null);
  const [hoveredService, setHoveredService] = useState(null);
  const [clickedCard, setClickedCard] = useState(null);

  const stats = useMemo(() => {
    const programCount = cards.reduce((sum, card) => sum + card.services.length, 0);
    const withRequirementsCount = cards.reduce(
      (sum, card) => sum + card.services.filter((s) => s.requirements.length > 0).length,
      0
    );
    return { categoryCount: cards.length, programCount, withRequirementsCount };
  }, [cards]);

  const activeData = activeCard ? cards.find((card) => card.id === activeCard) : null;

  const handleCardClick = (id) => {
    setClickedCard(id);
    window.setTimeout(() => {
      setClickedCard(null);
      setActiveCard(id);
      setExpandedService(null);
      const scroller = document.getElementById("app-scroll");
      if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 320);
  };

  const handleBack = () => {
    setActiveCard(null);
    setExpandedService(null);
    window.setTimeout(() => {
      document.getElementById("services-grid")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-r from-brand-page-from via-brand-page-via to-brand-page-to">
      {!activeData ? (
        <>
          <ServicesHero hero={hero} stats={stats} />
          {catalogStatus === "loading" ? (
            <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-6">
              <div className="animate-pulse rounded-3xl border border-white/70 bg-white/80 p-8 shadow-sm">
                <div className="mx-auto h-4 w-2/3 rounded bg-gray-100" />
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-48 rounded-2xl bg-gray-100" />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {catalogStatus === "error" ? (
            <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-6">
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                <p className="font-semibold">Could not load live assistance services.</p>
                <p className="mt-1">{catalogError}</p>
              </div>
            </div>
          ) : null}
          {catalogStatus === "ready" && cards.length === 0 ? (
            <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-6">
              <div className="rounded-3xl border border-brand/25 bg-white/90 p-6 text-sm text-gray-600">
                No active assistance categories are available right now.
              </div>
            </div>
          ) : null}
          {catalogStatus === "ready" && cards.length > 0 ? (
          <ServicesCategoryGrid
            cards={cards}
            hint={hint}
            hoveredService={hoveredService}
            setHoveredService={setHoveredService}
            clickedCard={clickedCard}
            onCardClick={handleCardClick}
          />
          ) : null}
        </>
      ) : null}

      {activeData ? (
        <ServiceDetailView
          data={activeData}
          strings={strings}
          expandedService={expandedService}
          setExpandedService={setExpandedService}
          onBack={handleBack}
        />
      ) : null}
    </div>
  );
};

export default ServicesPage;
