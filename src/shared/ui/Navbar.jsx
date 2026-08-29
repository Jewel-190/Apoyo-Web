import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGlobalContent } from "../content/WebContentContext";
import { plainText } from "../content/richText";
import { NAV_MENU_CLOSE_LABEL, NAV_MENU_OPEN_LABEL, SITE_NAV_LINKS } from "../lib/siteNav";
import { APOYO_LOGO_ALT, APOYO_LOGO_URL } from "../lib/brandingAssets";
import ContentImage from "./ContentImage";

const Navbar = () => {
  const location = useLocation();
  const nav = useGlobalContent().navbar ?? {};

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [location.pathname]);

  return (
    <nav className="pointer-events-none absolute inset-x-0 top-0 z-50 w-full">
      <div
        className="pointer-events-auto relative shadow-[0_10px_28px_-20px_rgba(var(--web-ink-rgb),0.22)] backdrop-blur-2xl backdrop-saturate-150"
        style={{ backgroundImage: "var(--web-nav-gradient)" }}
      >
        <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:h-20 lg:px-10">
          <div className="relative z-10 flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5 lg:gap-3">
            <ContentImage
              src={APOYO_LOGO_URL}
              alt={APOYO_LOGO_ALT}
              slot="logoNavPrimary"
              loading="eager"
            />
            {nav.dasmaLogo ? (
              <ContentImage
                src={nav.dasmaLogo}
                alt={plainText(nav.dasmaLogoAlt) || "Dasmariñas Logo"}
                slot="logoNavSecondary"
                loading="eager"
              />
            ) : null}
            {nav.dasmaBanner ? (
              <ContentImage
                src={nav.dasmaBanner}
                alt={plainText(nav.dasmaBannerAlt) || "Dasmariñas Banner"}
                slot="logoNavBanner"
                loading="eager"
              />
            ) : null}
          </div>

          {/* Absolutely centered so logos/menu button don't shift the tabs */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center lg:flex">
            <div className="pointer-events-auto flex items-center gap-8 xl:gap-10">
              {SITE_NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={`${link.name}-${link.path}`}
                    to={link.path}
                    className={`group relative overflow-hidden rounded-full px-4 py-1.5 text-base font-semibold leading-none tracking-tight transition-all duration-200 ${
                      isActive
                        ? "bg-brand/14 text-brand-ink shadow-sm shadow-brand-ink/5"
                        : "text-gray-900 hover:bg-white/80 hover:text-brand"
                    }`}
                  >
                    {link.name}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-[2.5px] bg-brand transition-all duration-300 ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-80"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 ml-auto flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand/15 bg-white/90 text-gray-800 transition-colors hover:bg-brand-soft"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? NAV_MENU_CLOSE_LABEL : NAV_MENU_OPEN_LABEL}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="relative border-t border-brand/10 bg-[rgba(var(--web-soft-rgb),0.78)] px-4 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-1">
              {SITE_NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={`${link.name}-${link.path}`}
                    to={link.path}
                    className={`rounded-xl px-3 py-3 text-base font-semibold transition-colors ${
                      isActive ? "bg-brand/14 text-brand-ink" : "text-gray-900 hover:bg-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
