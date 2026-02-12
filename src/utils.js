// src/utils.js

/**
 * @typedef {Object} ImageItem
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string[]} tags
 * @property {string} thumb
 * @property {string} full
 * @property {string} alt
 */

export function normalizeText(s) {
  return String(s ?? "").trim().toLowerCase();
}

export function validateImageItem(item) {
  if (!item || typeof item !== "object") return { ok: false, error: "Item is not an object" };

  const requiredString = ["id", "title", "category", "thumb", "full", "alt"];
  for (const key of requiredString) {
    if (typeof item[key] !== "string" || item[key].trim() === "") {
      return { ok: false, error: `Missing/invalid "${key}"` };
    }
  }

  if (!Array.isArray(item.tags) || item.tags.some(t => typeof t !== "string" || t.trim() === "")) {
    return { ok: false, error: `Missing/invalid "tags"` };
  }

  return { ok: true, error: null };
}

export function parseAndValidateJson(json) {
  if (!json || typeof json !== "object" || !Array.isArray(json.images)) {
    return { ok: false, images: [], errors: ["JSON must have an images array"] };
  }

  const errors = [];
  const images = [];

  for (const item of json.images) {
    const res = validateImageItem(item);
    if (!res.ok) errors.push(`${item?.id ?? "unknown"}: ${res.error}`);
    else images.push(item);
  }

  return { ok: errors.length === 0, images, errors };
}

export function filterByCategory(images, category) {
  const c = normalizeText(category);
  if (!c || c === "all") return images;
  return images.filter(img => normalizeText(img.category) === c);
}

export function filterByTags(images, selectedTags) {
  const tags = (selectedTags ?? []).map(normalizeText).filter(Boolean);
  if (tags.length === 0) return images;

  // AND-logik
  return images.filter(img => {
    const imgTags = new Set((img.tags || []).map(normalizeText));
    return tags.every(t => imgTags.has(t));
  });
}

export function searchImages(images, query) {
  const q = normalizeText(query);
  if (!q) return images;

  return images.filter(img => {
    const hay = [
      img.title,
      img.category,
      ...(img.tags || [])
    ].map(normalizeText).join(" ");
    return hay.includes(q);
  });
}

export function applyFilters(images, { category = "all", selectedTags = [], query = "" } = {}) {
  let out = images.slice();
  out = filterByCategory(out, category);
  out = filterByTags(out, selectedTags);
  out = searchImages(out, query);
  return out;
}

/**
 * Returnerar top N vanligaste taggar baserat på förekomst i bilderna.
 * @param {ImageItem[]} images
 * @param {number} n
 */
export function getTopTags(images, n = 20) {
  const counts = new Map();

  for (const img of images) {
    for (const t of img.tags || []) {
      const nt = normalizeText(t);
      if (!nt) continue;
      counts.set(nt, (counts.get(nt) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([tag]) => tag);
}

/**
 * Bygger en unik, sorterad lista av alla taggar.
 * @param {ImageItem[]} images
 */
export function getAllUniqueTags(images) {
  const set = new Set();
  for (const img of images) {
    for (const t of img.tags || []) set.add(normalizeText(t));
  }
  return Array.from(set).filter(Boolean).sort();
}

/**
 * Förslag på taggar (simple contains-match) med limit.
 */
export function suggestTags(allTags, selectedTags, inputValue, limit = 10) {
  const q = normalizeText(inputValue);
  if (!q) return [];

  const selected = new Set((selectedTags ?? []).map(normalizeText));
  const out = [];

  for (const t of allTags) {
    if (selected.has(t)) continue;
    if (t.includes(q)) out.push(t);
    if (out.length >= limit) break;
  }

  return out;
}
