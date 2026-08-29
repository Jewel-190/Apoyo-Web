/* eslint-disable react-refresh/only-export-components */
/**
 * Rich-text rendering for CMS content.
 *
 * The admin CMS stores rich fields as lightweight markdown (or raw HTML). This
 * mirrors the admin's `normalizeRichTextHtml` exactly so the website renders
 * copy identically to the CMS preview — a single, shared rendering contract.
 */
import { createElement } from "react";
import { sanitizeCmsHtml } from "../lib/sanitizeHtml";

const escapeHtml = (text = "") =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const isHtmlRichText = (text = "") => /<\/?[a-z][\s\S]*>/i.test(text);

const markdownToHtml = (text = "") =>
  escapeHtml(text)
    .replaceAll(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replaceAll(/_(.+?)_/g, "<em>$1</em>")
    .replaceAll(/~~(.+?)~~/g, "<del>$1</del>")
    .replaceAll(/`(.+?)`/g, "<code>$1</code>")
    .replaceAll(
      /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    )
    .replaceAll(/\n/g, "<br />");

export const normalizeRichTextHtml = (text = "") => {
  if (!text) return "";
  return isHtmlRichText(text) ? sanitizeCmsHtml(text) : markdownToHtml(text);
};

/** Strip markup to a plain string — for alt text, titles, aria labels, document title. */
export const plainText = (value = "") => {
  if (!value) return "";
  const html = normalizeRichTextHtml(value);
  return html
    .replace(/<[^>]*>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Renders a CMS rich-text value into the given element.
 * `accent` styles inline <strong> with the site primary (used for headline
 * emphasis, matching the site's highlighted keywords).
 */
export function RichText({ value, as = "span", className = "", accent = false, ...rest }) {
  const html = normalizeRichTextHtml(value ?? "");
  const cls = [className, accent ? "[&_strong]:font-semibold [&_strong]:text-brand" : ""]
    .filter(Boolean)
    .join(" ");
  return createElement(as, { className: cls, ...rest, dangerouslySetInnerHTML: { __html: html } });
}
