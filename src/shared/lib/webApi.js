const FUNCTION_NAME = "web";
export const WEB_CONTENT_CACHE_KEY = "apoyo.webContent.v1";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function emptyPages() {
  return { global: {}, home: {}, services: {}, about: {} };
}

export function readCachedPublicWebContent() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WEB_CONTENT_CACHE_KEY) || "");
    if (!parsed || typeof parsed !== "object" || !parsed.pages || typeof parsed.pages !== "object") {
      return null;
    }
    return {
      pages: { ...emptyPages(), ...parsed.pages },
      legal: parsed.legal ?? null,
    };
  } catch {
    return null;
  }
}

export function writeCachedPublicWebContent(payload) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      WEB_CONTENT_CACHE_KEY,
      JSON.stringify({
        v: 1,
        t: Date.now(),
        pages: payload.pages ?? {},
        legal: payload.legal ?? null,
      })
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

let inflight = null;

async function fetchPublicWebContentNetwork() {
  const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    cache: "no-store",
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || "Failed to load website content.");
  }
  return {
    pages: data.pages ?? {},
    legal: data.legal ?? null,
  };
}

/** Public marketing site: pages + legal in one round trip. Dedupes in-flight calls. */
export function fetchPublicWebContent() {
  if (inflight) return inflight;
  inflight = fetchPublicWebContentNetwork().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Kick off the payload as soon as this module evaluates (overlaps React boot). */
if (typeof window !== "undefined") {
  fetchPublicWebContent().catch(() => {
    // Hydration / retry happens in WebContentProvider.
  });
}
