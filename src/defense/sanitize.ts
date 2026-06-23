/**
 * Defense pipeline — step 1 (unicode) and step 3 (input tagging).
 *
 * The full pipeline order (see DESIGN.md) is:
 *   1. normalizeUnicode  — fold look-alikes + strip invisible smuggling
 *   2. stripHtml         — remove hidden/comment/markup payloads (added next)
 *   3. tagUntrusted      — wrap content so the model treats it as data, not instructions
 */

import { parse, type HTMLElement } from "node-html-parser";

const ZERO_WIDTH = /[​-‍﻿]/g; // ZWSP, ZWNJ, ZWJ, BOM
const TAG_BLOCK = /[\u{E0000}-\u{E007F}]/gu; // Unicode Tags block (invisible smuggling)

/** NFKC-fold, then strip zero-width and Unicode-tag characters. */
export function normalizeUnicode(input: string): string {
  return input.normalize("NFKC").replace(ZERO_WIDTH, "").replace(TAG_BLOCK, "");
}

const DELIM_OPEN = "<untrusted>";
const DELIM_CLOSE = "</untrusted>";

// Match our delimiter tokens even with case / internal-whitespace tricks.
const CLOSE_TOKEN = /<\s*\/\s*untrusted\s*>/gi;
const OPEN_TOKEN = /<\s*untrusted\s*>/gi;

/** Replace the leading "<" of a delimiter token with the HTML entity so it can't break out. */
function neutralize(token: string): string {
  return "&lt;" + token.slice(token.indexOf("<") + 1);
}

/**
 * Wrap untrusted content in delimiters, after neutralizing any delimiter tokens
 * the payload itself contains (so an attacker cannot inject a fake `</untrusted>`
 * to escape the wrapper). Close tokens are handled before open tokens.
 */
export function tagUntrusted(input: string): string {
  const escaped = input.replace(CLOSE_TOKEN, neutralize).replace(OPEN_TOKEN, neutralize);
  return `${DELIM_OPEN}\n${escaped}\n${DELIM_CLOSE}`;
}

// Inline-style / attribute signals that an element is hidden (the white-on-white,
// off-screen, and zero-size tricks attackers use to feed text only to the model).
const HIDDEN_STYLE =
  /(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?!\s*\.\s*[1-9])|font-size\s*:\s*0(?:px)?\s*(?:;|$)|color\s*:\s*(?:#fff(?:fff)?\b|white\b|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)))/i;

function isHidden(el: HTMLElement): boolean {
  const tag = el.rawTagName?.toLowerCase();
  if (tag === "script" || tag === "style") return true;
  if (el.hasAttribute("hidden")) return true;
  if ((el.getAttribute("aria-hidden") || "").toLowerCase() === "true") return true;
  return HIDDEN_STYLE.test(el.getAttribute("style") || "");
}

/**
 * Strip markup down to the text a human would actually see: drop comments,
 * script/style, and elements hidden via inline style / attributes, then remove
 * remaining tags and collapse whitespace.
 */
export function stripHtml(input: string): string {
  const root = parse(input, { comment: false });
  for (const el of root.querySelectorAll("*")) {
    if (isHidden(el)) el.remove();
  }
  return (root.textContent || "").replace(/\s+/g, " ").trim();
}

/**
 * Full defense pipeline, applied in order before the model reads any untrusted
 * content: (1) unicode normalization, (2) HTML/visibility stripping, (3) tagging.
 */
export function sanitize(input: string): string {
  return tagUntrusted(stripHtml(normalizeUnicode(input)));
}
