/**
 * Basic HTML sanitizer for rendering email content in the mobile app.
 * Strips dangerous elements and attributes while preserving safe formatting.
 *
 * IMPORTANT: For production, consider using a proper sanitization library
 * like DOMPurify with a React Native compatible renderer.
 * This utility provides baseline sanitization for text extraction.
 */

/** Strip all HTML tags and return plain text */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";

  return html
    // Remove script and style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Replace line-break elements with newlines
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    // Remove all remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Collapse multiple whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract a text preview from HTML content */
export function htmlToSnippet(
  html: string | null | undefined,
  maxLength: number = 150
): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "…";
}

/** List of tags that are safe to keep for WebView rendering */
export const SAFE_TAGS = new Set([
  "p",
  "br",
  "b",
  "i",
  "u",
  "em",
  "strong",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img",
  "span",
  "div",
]);

/** Attributes that are safe to keep */
export const SAFE_ATTRIBUTES = new Set([
  "href",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "style",
  "class",
]);
