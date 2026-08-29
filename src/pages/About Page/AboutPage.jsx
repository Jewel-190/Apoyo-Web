import React from "react";
import { Link } from "react-router-dom";
import ScrollReveal from "../../shared/ui/ScrollReveal";
import { instrument } from "../../shared/lib/fonts";
import { ABOUT_QUICK_LINKS_TITLE, buildAboutQuickLinkEntries } from "../../shared/lib/aboutQuickLinks";
import { usePageContent } from "../../shared/content/WebContentContext";
import { RichText, plainText } from "../../shared/content/richText";
import ContentImage from "../../shared/ui/ContentImage";
import { safeHref } from "../../shared/lib/safeHref";

/** Shared chrome for Legal pages (presentational only). */
export const LegalShell = ({ title, children }) => (
  <div className="min-h-[calc(100vh-5rem)] w-full bg-gradient-to-r from-brand-page-from via-brand-page-via to-brand-page-to px-4 py-12">
    <ScrollReveal
      as="article"
      className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-white/90 px-6 py-10 shadow-sm backdrop-blur-sm md:px-10 md:py-12"
      rootMargin="0px 0px 0px 0px"
    >
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-brand" style={instrument}>
        Legal
      </p>
      <h1 className="mb-8 text-3xl font-semibold text-gray-900" style={{ ...instrument, fontWeight: 600 }}>
        {title}
      </h1>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700" style={instrument}>
        {children}
      </div>

      <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-100 pt-8">
        <Link to="/about" className="text-sm font-medium text-brand hover:underline" style={instrument}>
          ← Back to About Us
        </Link>
      </div>
    </ScrollReveal>
  </div>
);

const channelCardClass =
  "rounded-2xl border border-gray-100 bg-gradient-to-br from-brand-wash to-white px-5 py-4 transition-all hover:border-brand/25 hover:shadow-md";

const channelPrimaryClass =
  "inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm text-white shadow-md shadow-brand/20 transition-transform hover:-translate-y-0.5";

const channelSecondaryClass =
  "inline-flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm text-gray-800 transition-colors hover:border-brand/35";

const telHref = (display) => `tel:${String(display ?? "").replace(/[^\d+]/g, "")}`;

const ENTRY_KINDS = new Set(["text", "phone", "email", "link", "route"]);
const ENTRY_STYLES = new Set(["card", "primary", "secondary"]);

function normalizeChannelEntry(entry = {}) {
  const raw =
    entry && typeof entry.jsonb_build_object === "object" && entry.jsonb_build_object
      ? entry.jsonb_build_object
      : entry;
  return {
    kind: ENTRY_KINDS.has(raw.kind) ? raw.kind : "text",
    label: raw.label ?? "",
    body: raw.body ?? "",
    href: raw.href ?? "",
    style: ENTRY_STYLES.has(raw.style) ? raw.style : "card",
  };
}

function pushLegacyEntry(entries, entry) {
  const next = normalizeChannelEntry(entry);
  if (!String(next.body).trim() && !String(next.href).trim() && !String(next.label).trim()) return;
  entries.push(next);
}

function isQuickLinksGroup(group) {
  if (!group || typeof group !== "object") return false;
  if (group.id === "quickLinks") return true;
  return /^quick\s*links$/i.test(String(group.title ?? "").trim());
}

function pinQuickLinksLast(groups) {
  const rest = [];
  for (const group of groups) {
    if (!isQuickLinksGroup(group)) rest.push(group);
  }
  rest.push({
    id: "quickLinks",
    title: ABOUT_QUICK_LINKS_TITLE,
    entries: buildAboutQuickLinkEntries().map(normalizeChannelEntry),
  });
  return rest;
}

/** Carry legacy flat channels into stackable groups[] for the public site. */
function normalizeChannels(channels = {}) {
  if (Array.isArray(channels.groups)) {
    const groups = pinQuickLinksLast(
      channels.groups.map((g) => ({
        ...(isQuickLinksGroup(g) ? { id: "quickLinks" } : g.id ? { id: g.id } : {}),
        title: g?.title ?? "",
        entries: Array.isArray(g?.entries) ? g.entries.map(normalizeChannelEntry) : [],
      }))
    );
    return {
      heading: channels.heading ?? "",
      intro: channels.intro ?? "",
      groups,
    };
  }

  const groups = [];
  const mayor = [];
  pushLegacyEntry(mayor, { kind: "text", label: "Address", body: channels.mayorAddress });
  pushLegacyEntry(mayor, { kind: "phone", label: "Landline", body: channels.mayorLandline });
  pushLegacyEntry(mayor, { kind: "phone", label: "Cellphone", body: channels.mayorCell });
  pushLegacyEntry(mayor, { kind: "email", label: "Email · Open in Gmail", body: channels.mayorEmail });
  if (mayor.length) groups.push({ title: "Office of the City Mayor", entries: mayor });

  const city = [];
  if (channels.facebookCityUrl) {
    pushLegacyEntry(city, {
      kind: "link",
      label: "Facebook",
      body: channels.facebookCityLabel,
      href: channels.facebookCityUrl,
    });
  }
  if (channels.facebookCswdoUrl) {
    pushLegacyEntry(city, {
      kind: "link",
      label: "CSWDO",
      body: channels.facebookCswdoLabel,
      href: channels.facebookCswdoUrl,
    });
  }
  if (city.length) groups.push({ title: "City & programs", entries: city });

  const panteon = [];
  pushLegacyEntry(panteon, { kind: "text", label: "Address", body: channels.panteonAddress });
  pushLegacyEntry(panteon, { kind: "phone", label: "Smart / TNT", body: channels.panteonSmart });
  pushLegacyEntry(panteon, { kind: "phone", label: "Globe / TM", body: channels.panteonGlobe });
  pushLegacyEntry(panteon, { kind: "phone", label: "Landline", body: channels.panteonLandline });
  pushLegacyEntry(panteon, { kind: "email", label: "Email · Open in Gmail", body: channels.panteonEmail });
  if (channels.panteonFacebookUrl) {
    pushLegacyEntry(panteon, {
      kind: "link",
      label: "Facebook",
      body: channels.panteonFacebookLabel,
      href: channels.panteonFacebookUrl,
    });
  }
  if (panteon.length) groups.push({ title: "Panteon / Lafuneraria de Dasmariñas", entries: panteon });

  return {
    heading: channels.heading ?? "",
    intro: channels.intro ?? "",
    groups: pinQuickLinksLast(groups),
  };
}

function entryDestination(entry) {
  const href = String(entry.href ?? "").trim();
  const body = String(entry.body ?? "").trim();
  if (entry.kind === "phone") return safeHref(telHref(body || href));
  if (entry.kind === "email") {
    const email = body || href;
    if (!email) return "";
    if (/^mailto:/i.test(email)) return safeHref(email);
    if (email.includes(":")) return "";
    return safeHref(`mailto:${email}`);
  }
  if (entry.kind === "link" || entry.kind === "route") return safeHref(href || body);
  return "";
}

function entryDisplayText(entry) {
  const body = String(entry.body ?? "").trim();
  const label = String(entry.label ?? "").trim();
  const href = String(entry.href ?? "").trim();
  if (entry.style === "primary" || entry.style === "secondary") return label || plainText(body) || href;
  return body || href || label;
}

function ChannelEntry({ entry }) {
  const kind = entry.kind;
  const style = entry.style || "card";
  const label = String(entry.label ?? "").trim();
  const display = entryDisplayText(entry);
  const dest = entryDestination(entry);
  if (!display && !dest) return null;

  if (style === "primary" || style === "secondary") {
    const cls = style === "primary" ? channelPrimaryClass : channelSecondaryClass;
    const text = display || label;
    if (!text) return null;
    if (kind === "route" && dest) {
      return (
        <Link to={dest} className={cls} style={{ ...instrument, fontWeight: style === "primary" ? 600 : 400 }}>
          {text}
        </Link>
      );
    }
    if (dest) {
      return (
        <a
          href={dest}
          target={kind === "link" || kind === "email" ? "_blank" : undefined}
          rel={kind === "link" || kind === "email" ? "noopener noreferrer" : undefined}
          className={cls}
          style={{ ...instrument, fontWeight: style === "primary" ? 600 : 400 }}
        >
          {text}
        </a>
      );
    }
    return (
      <div className={cls} style={{ ...instrument, fontWeight: style === "primary" ? 600 : 400 }}>
        {text}
      </div>
    );
  }

  const inner = (
    <>
      {label ? <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">{label}</p> : null}
      {kind === "text" ? (
        <RichText as="p" value={entry.body || entry.href} className="text-sm font-semibold leading-relaxed text-gray-900" />
      ) : (
        <p
          className={`text-sm font-semibold ${kind === "email" ? "break-all text-brand" : "text-gray-900"}`}
        >
          {plainText(display)}
        </p>
      )}
    </>
  );

  if (kind === "text" || !dest) {
    return (
      <div className={channelCardClass} style={instrument}>
        {inner}
      </div>
    );
  }

  if (kind === "route") {
    return (
      <Link to={dest} className={`block ${channelCardClass}`} style={instrument}>
        {inner}
      </Link>
    );
  }

  return (
    <a
      href={dest}
      target={kind === "link" || kind === "email" ? "_blank" : undefined}
      rel={kind === "link" || kind === "email" ? "noopener noreferrer" : undefined}
      className={`block ${channelCardClass}`}
      style={instrument}
    >
      {inner}
    </a>
  );
}
function AboutHero({ hero }) {
  return (
    <ScrollReveal
      as="section"
      className="relative overflow-hidden px-4 pb-14 pt-16"
      rootMargin="0px 0px 0px 0px"
    >
      <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl text-center">
        {hero.logo ? <ContentImage src={hero.logo} alt="" slot="logoPageLg" /> : null}
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-brand" style={instrument}>
          {hero.kicker}
        </p>
        <RichText
          as="h1"
          value={hero.heading}
          className="mb-4 text-3xl leading-tight text-gray-900 md:text-4xl"
          style={{ ...instrument, fontWeight: 600 }}
        />
        <RichText
          as="p"
          value={hero.body}
          className="text-base leading-relaxed text-gray-600"
          style={instrument}
        />
      </div>
    </ScrollReveal>
  );
}

function PartnerMarquee({ partners }) {
  const logos = Array.isArray(partners.logos) ? partners.logos : [];
  if (!logos.length) return null;
  const loop = [...logos, ...logos];

  return (
    <ScrollReveal as="section" className="px-4 pb-14" aria-label="City offices and programs" delay={50}>
      <div className="mx-auto max-w-5xl">
        <RichText
          as="h2"
          value={partners.heading}
          className="mb-6 text-center text-lg text-gray-900 md:text-xl"
          style={{ ...instrument, fontWeight: 600 }}
        />
        <RichText
          as="p"
          value={partners.subcopy}
          className="mx-auto mb-8 max-w-2xl text-center text-sm leading-relaxed text-gray-600"
          style={instrument}
        />

        <div className="relative overflow-hidden rounded-[2rem] border border-brand/10 bg-white/70 py-8 shadow-inner shadow-gray-200/40 backdrop-blur-sm md:py-9">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-brand-page-from to-transparent md:w-20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-brand-page-from to-transparent md:w-20"
            aria-hidden
          />
          <div className="overflow-hidden px-2 py-2 md:py-3">
            <div className="animate-partner-marquee flex w-max items-center gap-10 px-4 md:gap-14">
              {loop.map((logo, index) => (
                <div key={`${logo.label}-${index}`} className="flex flex-shrink-0 flex-col items-center gap-2">
                  <div
                    className="animate-partner-logo-float py-1"
                    style={{ animationDelay: `${(index % logos.length) * 0.35}s` }}
                  >
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand/20 via-transparent to-brand/10 blur-md" />
                      <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full border-[3px] border-white bg-white shadow-[0_12px_40px_-18px_rgba(var(--web-primary-rgb),0.45)]">
                        <ContentImage src={logo.src} alt={plainText(logo.label)} slot="partner" />
                      </div>
                    </div>
                  </div>
                  <p className="max-w-[7.5rem] text-center text-xs text-gray-600" style={instrument}>
                    {logo.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

function AboutPillars({ pillars }) {
  const list = Array.isArray(pillars) ? pillars : [];
  if (!list.length) return null;
  return (
    <ScrollReveal as="section" className="px-4 pb-14" delay={70}>
      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
        {list.map((pillar, index) => (
          <div
            key={`${pillar.title}-${index}`}
            className="rounded-2xl border border-white/80 bg-white/85 p-6 shadow-sm shadow-gray-200/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <h2 className="mb-2 text-base text-gray-900" style={{ ...instrument, fontWeight: 600 }}>
              {pillar.title}
            </h2>
            <RichText as="p" value={pillar.body} className="text-sm leading-relaxed text-gray-600" style={instrument} />
          </div>
        ))}
      </div>
    </ScrollReveal>
  );
}

function OfficialChannels({ channels }) {
  const data = normalizeChannels(channels);
  const groups = Array.isArray(data.groups) ? data.groups : [];
  if (!data.heading && !data.intro && !groups.length) return null;

  return (
    <ScrollReveal as="section" className="px-4 pb-14" delay={90}>
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-brand/10 bg-white/80 p-8 shadow-[0_24px_60px_-40px_rgba(var(--web-primary-rgb),0.35)] backdrop-blur-sm md:p-10">
        {data.heading ? (
          <RichText
            as="h2"
            value={data.heading}
            className="mb-2 text-center text-xl text-gray-900 md:text-2xl"
            style={{ ...instrument, fontWeight: 600 }}
          />
        ) : null}
        {data.intro ? (
          <RichText
            as="p"
            value={data.intro}
            className="mx-auto mb-8 max-w-2xl text-center text-sm leading-relaxed text-gray-600"
            style={instrument}
          />
        ) : null}

        <div className="flex flex-col gap-8">
          {groups.map((group, gi) => {
            const entries = Array.isArray(group.entries) ? group.entries : [];
            if (!group.title && !entries.length) return null;
            return (
              <div key={`${group.title}-${gi}`} className="flex flex-col gap-3">
                {group.title ? (
                  <h3
                    className="text-sm font-semibold uppercase tracking-[0.12em] text-brand"
                    style={instrument}
                  >
                    {group.title}
                  </h3>
                ) : null}
                <div className="flex flex-col gap-3">
                  {entries.map((entry, ei) => (
                    <ChannelEntry key={`${entry.kind}-${entry.label}-${ei}`} entry={entry} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
}

function ClosingCta({ closing }) {
  if (!closing?.boldLine && !closing?.body) return null;
  return (
    <ScrollReveal as="section" className="px-4 pb-20" delay={60}>
      <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-brand/25 bg-white/60 px-6 py-6 text-center backdrop-blur-sm">
        <RichText
          as="p"
          value={closing.boldLine}
          className="mb-2 text-sm font-semibold text-gray-900"
          style={{ ...instrument, fontWeight: 600 }}
        />
        <RichText as="p" value={closing.body} className="text-sm leading-relaxed text-gray-600" style={instrument} />
      </div>
    </ScrollReveal>
  );
}

const AboutPage = () => {
  const content = usePageContent("about");

  return (
    <div className="min-h-screen w-full bg-gradient-to-r from-brand-page-from via-brand-page-via to-brand-page-to">
      <AboutHero hero={content.hero ?? {}} />
      <PartnerMarquee partners={content.partners ?? {}} />
      <AboutPillars pillars={content.pillars} />
      <OfficialChannels channels={content.channels ?? {}} />
      <ClosingCta closing={content.closing ?? {}} />
    </div>
  );
};

export default AboutPage;
