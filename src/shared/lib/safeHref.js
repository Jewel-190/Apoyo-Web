/**
 * Allow only http(s), mailto, tel, in-app paths, and hashes.
 * Rejects javascript:, data:, and other unsafe schemes from CMS fields.
 */
export function safeHref(value) {
  const href = String(value ?? "").trim();
  if (!href) return "";

  const lower = href.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:")
  ) {
    return "";
  }

  if (href.startsWith("/") || href.startsWith("#") || href.startsWith("./")) {
    return href;
  }

  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return href;
  }

  return "";
}

export function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href ?? "").trim());
}
