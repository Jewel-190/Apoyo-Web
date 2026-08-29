import { LEGAL_PAGES, legalPagePath } from "./legalSettings";

export const ABOUT_QUICK_LINKS_TITLE = "Quick links";

/**
 * About Quick links: services, web Legal pages, then home.
 * App-only Legal copy (e.g. User Acceptance) is omitted here.
 */
export function buildAboutQuickLinkEntries() {
  return [
    {
      kind: "route",
      label: "Browse services",
      href: "/services",
      style: "primary",
    },
    ...LEGAL_PAGES.filter((page) => page.showInWebQuickLinks).map((page) => ({
      kind: "route",
      label: page.title,
      href: legalPagePath(page.slug),
      style: "secondary",
    })),
    {
      kind: "route",
      label: "Back to Home",
      href: "/",
      style: "secondary",
    },
  ];
}
