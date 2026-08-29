/* eslint-disable react-refresh/only-export-components */
/**
 * Web content layer.
 *
 * Marketing pages and Legal copy come from the `web` edge function
 * (`GET` / `public.get`). Favicon, Apoyo navbar logo, and primary nav links are
 * locked in code. Site-wide `theme.primary_color` is applied as CSS variables
 * on :root (see webTheme.js).
 *
 * Repeat visits paint from localStorage immediately, then revalidate in the
 * background (stale-while-revalidate).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { APOYO_FAVICON_URL } from "../lib/brandingAssets";
import { LEGAL_DEFAULTS, normalizeLegalSettings } from "../lib/legalSettings";
import { prefetchPublicCatalog } from "../lib/publicCatalog";
import {
  fetchPublicWebContent,
  readCachedPublicWebContent,
  writeCachedPublicWebContent,
} from "../lib/webApi";
import { applyWebTheme, pickWebTheme } from "../lib/webTheme";

const PAGES = ["global", "home", "services", "about"];

const WebContentContext = createContext(null);

const EMPTY = Object.freeze({});

function pagesFromPayload(data) {
  const next = {};
  for (const page of PAGES) next[page] = data?.pages?.[page] ?? {};
  return next;
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function scheduleIdle(fn, timeoutMs) {
  if (typeof window === "undefined") return () => {};
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, Math.min(timeoutMs, 800));
  return () => window.clearTimeout(id);
}

export function WebContentProvider({ children }) {
  const [initialCache] = useState(() =>
    typeof window !== "undefined" ? readCachedPublicWebContent() : null
  );
  const [status, setStatus] = useState(initialCache ? "ready" : "loading"); // "loading" | "ready" | "error"
  const [error, setError] = useState("");
  const [pages, setPages] = useState(() => (initialCache ? pagesFromPayload(initialCache) : EMPTY));
  const [legal, setLegal] = useState(() => normalizeLegalSettings(initialCache?.legal));

  const load = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setStatus("loading");
      setError("");
    }

    try {
      const data = await fetchPublicWebContent();
      const nextPages = pagesFromPayload(data);
      const nextLegal = normalizeLegalSettings(data.legal);
      writeCachedPublicWebContent({ pages: nextPages, legal: nextLegal });
      setPages((prev) => (sameJson(prev, nextPages) ? prev : nextPages));
      setLegal((prev) => (sameJson(prev, nextLegal) ? prev : nextLegal));
      setError("");
      setStatus("ready");
    } catch (loadError) {
      if (background) return;
      setError(loadError?.message || "Failed to load website content.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Revalidate on mount. If a cache already painted, stay interactive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load({ background: Boolean(initialCache) });
    // initialCache is a mount snapshot; load is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      document.head.appendChild(link);
    }
    link.href = APOYO_FAVICON_URL;
  }, []);

  useLayoutEffect(() => {
    if (status === "loading") return;
    const title = pages.global?.site?.title;
    if (title) document.title = title;
    applyWebTheme(pickWebTheme(pages.global?.theme).primary_color, { persist: true });
  }, [status, pages]);

  useEffect(() => {
    if (status !== "ready") return;
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/services") {
      prefetchPublicCatalog();
      return undefined;
    }
    return scheduleIdle(() => prefetchPublicCatalog(), 1200);
  }, [status]);

  const reload = useCallback(() => load({ background: false }), [load]);

  const value = useMemo(
    () => ({ status, error, pages, legal, reload }),
    [status, error, pages, legal, reload]
  );

  return <WebContentContext.Provider value={value}>{children}</WebContentContext.Provider>;
}

export function useWebContent() {
  const ctx = useContext(WebContentContext);
  if (!ctx) throw new Error("useWebContent must be used within <WebContentProvider>.");
  return ctx;
}

/** Content for a single page row (e.g. "home", "services"). */
export function usePageContent(page) {
  const { pages } = useWebContent();
  return pages[page] ?? EMPTY;
}

/** Site-wide chrome content (navbar, footer, site meta). */
export function useGlobalContent() {
  return usePageContent("global");
}

/** Terms and Conditions copy from the `web` edge function. */
export function useLegalContent() {
  const { legal } = useWebContent();
  return legal ?? LEGAL_DEFAULTS;
}
