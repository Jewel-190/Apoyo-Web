/**
 * Public assistance catalog for the marketing Services page.
 * Reads active categories / services / requirements / tips via anon Supabase (RLS).
 */
import { supabase } from "./supabaseClient";

const SELECT = {
  categories: "id,slug,assistance_name,description,sort_order,active,theme_json",
  services:
    "id,category_id,display_name,description_html,about_html,who_bullets,mobile_image_url,reminder_text,sort_order,active",
  requirements: "id,service_id,slot_key,title,help,sort_order,metadata",
  tips: "id,requirement_id,title,description,sort_order",
};

function sortByOrder(rows) {
  return [...(rows ?? [])].sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0));
}

/** theme_json is jsonb but may be double-encoded as a JSON string in the DB. */
export function coerceThemeJson(themeJson) {
  if (themeJson == null) return null;
  if (typeof themeJson === "string") {
    const trimmed = themeJson.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  if (typeof themeJson === "object" && !Array.isArray(themeJson)) return themeJson;
  return null;
}

async function runQuery(label, factory) {
  const result = await factory();
  if (result?.error) {
    throw new Error(`[PublicCatalog:${label}] ${result.error.message || "query failed"}`);
  }
  return result.data ?? [];
}

function readSampleFromMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { sampleDocumentImage: "", sampleDocumentName: "" };
  }
  return {
    sampleDocumentImage: String(metadata.sampleDocumentImage ?? "").trim(),
    sampleDocumentName: String(metadata.sampleDocumentName ?? "").trim(),
  };
}

const CATALOG_CACHE_KEY = "apoyo.publicCatalog.v1";
const CATALOG_FRESH_MS = 30_000;

let catalogMemory = null;
let catalogFetchedAt = 0;
let catalogInflight = null;

export function readCachedPublicCatalog() {
  if (catalogMemory) return catalogMemory;
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(CATALOG_CACHE_KEY) || "");
    if (!Array.isArray(parsed)) return null;
    catalogMemory = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedPublicCatalog(rows) {
  catalogMemory = rows;
  catalogFetchedAt = Date.now();
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(rows));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/**
 * @returns {Promise<Array>}
 */
export async function fetchPublicAssistanceCatalog() {
  const [categories, services, requirements, tips] = await Promise.all([
    runQuery("categories", () =>
      supabase
        .from("assistance_categories")
        .select(SELECT.categories)
        .eq("active", true)
        .order("sort_order", { ascending: true })
    ),
    runQuery("services", () =>
      supabase
        .from("assistance_services")
        .select(SELECT.services)
        .eq("active", true)
        .order("sort_order", { ascending: true })
    ),
    runQuery("requirements", () =>
      supabase.from("assistance_requirements").select(SELECT.requirements).order("sort_order", { ascending: true })
    ),
    runQuery("tips", () =>
      supabase.from("assistance_requirement_tips").select(SELECT.tips).order("sort_order", { ascending: true })
    ),
  ]);

  const activeCategories = sortByOrder(categories);
  const categoryIds = new Set(activeCategories.map((row) => row.id).filter(Boolean));
  const activeServices = sortByOrder(services).filter((row) => categoryIds.has(row.category_id));
  const serviceIds = new Set(activeServices.map((row) => row.id).filter(Boolean));
  const activeRequirements = sortByOrder(requirements).filter((row) => serviceIds.has(row.service_id));

  const tipsByRequirementId = new Map();
  for (const tip of tips) {
    const key = tip.requirement_id;
    if (!tipsByRequirementId.has(key)) tipsByRequirementId.set(key, []);
    tipsByRequirementId.get(key).push(tip);
  }

  const requirementsByServiceId = new Map();
  for (const req of activeRequirements) {
    // Skip internal attachment-slot rows used only by the mobile app workflow.
    if (String(req.slot_key || "").toLowerCase() === "attachment") continue;
    const sample = readSampleFromMetadata(req.metadata);
    const key = req.service_id;
    if (!requirementsByServiceId.has(key)) requirementsByServiceId.set(key, []);
    requirementsByServiceId.get(key).push({
      id: req.id,
      title: req.title ?? "",
      help: req.help ?? "",
      sampleDocumentImage: sample.sampleDocumentImage,
      sampleDocumentName: sample.sampleDocumentName,
      tips: sortByOrder(tipsByRequirementId.get(req.id) ?? []).map((tip) => ({
        id: tip.id,
        title: tip.title ?? "",
        description: tip.description ?? "",
      })),
    });
  }

  const servicesByCategoryId = new Map();
  for (const svc of activeServices) {
    const key = svc.category_id;
    if (!servicesByCategoryId.has(key)) servicesByCategoryId.set(key, []);
    servicesByCategoryId.get(key).push({
      ...svc,
      assistance_requirements: sortByOrder(requirementsByServiceId.get(svc.id) ?? []),
    });
  }

  return activeCategories.map((cat) => ({
    ...cat,
    theme_json: coerceThemeJson(cat.theme_json),
    assistance_services: sortByOrder(servicesByCategoryId.get(cat.id) ?? []),
  }));
}

/** Deduped catalog load. Reuses a fresh in-memory result for ~30s. */
export function ensurePublicCatalog() {
  if (catalogMemory && Date.now() - catalogFetchedAt < CATALOG_FRESH_MS) {
    return Promise.resolve(catalogMemory);
  }
  if (catalogInflight) return catalogInflight;
  catalogInflight = fetchPublicAssistanceCatalog()
    .then((rows) => {
      writeCachedPublicCatalog(rows);
      return rows;
    })
    .finally(() => {
      catalogInflight = null;
    });
  return catalogInflight;
}

export function prefetchPublicCatalog() {
  ensurePublicCatalog().catch(() => {
    // Services page will surface the error if the user navigates there.
  });
}

/** Strip tags / entities for plain marketing copy from CMS HTML fields. */
export function htmlToPlainText(html) {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
