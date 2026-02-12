// src/main.js
import {
  applyFilters,
  parseAndValidateJson,
  normalizeText,
  getTopTags,
  getAllUniqueTags,
  suggestTags
} from "./utils.js";

const els = {
  gallery: document.getElementById("gallery"),
  statusLine: document.getElementById("statusLine"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  searchInput: document.getElementById("searchInput"),

  tagInput: document.getElementById("tagInput"),
  tagSuggestions: document.getElementById("tagSuggestions"),
  topTagChips: document.getElementById("topTagChips"),
  selectedTagChips: document.getElementById("selectedTagChips"),
  clearTagsBtn: document.getElementById("clearTagsBtn"),

  viewer: document.getElementById("viewer"),
  viewerImg: document.getElementById("viewerImg"),
  viewerCaption: document.getElementById("viewerCaption"),
  closeViewerBtn: document.getElementById("closeViewerBtn"),
};

let allImages = [];
let allTags = [];

let state = {
  category: "all",
  selectedTags: [],
  query: "",
};

async function loadImages() {
  const res = await fetch("./data/images.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Kunde inte hämta JSON (${res.status})`);
  const json = await res.json();

  const parsed = parseAndValidateJson(json);
  if (!parsed.ok) console.warn("JSON valideringsfel:", parsed.errors);
  return parsed.images;
}

function setActiveTab(category) {
  const c = normalizeText(category);
  for (const b of els.tabs) {
    b.classList.toggle("is-active", normalizeText(b.dataset.category) === c);
  }
}

function addTag(tag) {
  const t = normalizeText(tag);
  if (!t) return;
  if (!state.selectedTags.some(x => normalizeText(x) === t)) state.selectedTags.push(t);
}

function removeTag(tag) {
  const t = normalizeText(tag);
  state.selectedTags = state.selectedTags.filter(x => normalizeText(x) !== t);
}

function openViewer(imgItem) {
  els.viewerImg.src = imgItem.full;
  els.viewerImg.alt = imgItem.alt || imgItem.title;
  els.viewerCaption.textContent = `${imgItem.title} • ${imgItem.category} • ${imgItem.tags.join(", ")}`;

  if (typeof els.viewer.showModal === "function") els.viewer.showModal();
  else els.viewer.setAttribute("open", "");
}

function closeViewer() {
  if (typeof els.viewer.close === "function") els.viewer.close();
  else els.viewer.removeAttribute("open");
  els.viewerImg.src = "";
}

function renderGallery(items) {
  els.gallery.innerHTML = "";

  for (const img of items) {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;

    const fig = document.createElement("figure");
    const imageEl = document.createElement("img");
    imageEl.loading = "lazy";
    imageEl.decoding = "async";
    imageEl.src = img.thumb;
    imageEl.alt = img.alt || img.title;

    const cap = document.createElement("figcaption");
    cap.textContent = img.title;

    fig.appendChild(imageEl);
    fig.appendChild(cap);
    card.appendChild(fig);

    const onOpen = () => openViewer(img);
    card.addEventListener("click", onOpen);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen();
      }
    });

    els.gallery.appendChild(card);
  }
}

function renderSelectedTagChips() {
  els.selectedTagChips.innerHTML = "";
  for (const t of state.selectedTags) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip is-active";
    chip.textContent = t;
    chip.setAttribute("role", "listitem");
    chip.addEventListener("click", () => {
      removeTag(t);
      render();
    });
    els.selectedTagChips.appendChild(chip);
  }
}

function renderTopTags() {
  const top = getTopTags(allImages, 20);
  els.topTagChips.innerHTML = "";

  for (const t of top) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = t;
    btn.setAttribute("role", "listitem");

    const selected = state.selectedTags.some(x => normalizeText(x) === normalizeText(t));
    if (selected) btn.classList.add("is-active");

    btn.addEventListener("click", () => {
      const isSelected = state.selectedTags.some(x => normalizeText(x) === normalizeText(t));
      if (isSelected) removeTag(t);
      else addTag(t);
      render();
    });

    els.topTagChips.appendChild(btn);
  }
}

function showSuggestions(list) {
  els.tagSuggestions.innerHTML = "";

  if (list.length === 0) {
    els.tagSuggestions.style.display = "none";
    return;
  }

  for (const t of list) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggestion";
    btn.textContent = t;
    btn.setAttribute("role", "option");
    btn.addEventListener("click", () => {
      addTag(t);
      els.tagInput.value = "";
      els.tagSuggestions.style.display = "none";
      render();
    });
    els.tagSuggestions.appendChild(btn);
  }

  els.tagSuggestions.style.display = "block";
}

function render() {
  const filtered = applyFilters(allImages, state);
  renderGallery(filtered);

  renderTopTags();
  renderSelectedTagChips();
  setActiveTab(state.category);

  const tagText = state.selectedTags.length ? `, taggar: ${state.selectedTags.join(", ")}` : "";
  const qText = state.query ? `, sök: "${state.query}"` : "";
  els.statusLine.textContent =
    `${filtered.length} av ${allImages.length} bilder visas (kategori: ${state.category}${tagText}${qText}).`;
}

function wireEvents() {
  // Kategoriflikar
  for (const b of els.tabs) {
    b.addEventListener("click", () => {
      state.category = b.dataset.category || "all";
      render();
    });
  }

  // Sök på bilder
  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    render();
  });

  // Tagg input -> suggestions
  els.tagInput.addEventListener("input", () => {
    const suggestions = suggestTags(allTags, state.selectedTags, els.tagInput.value, 10);
    showSuggestions(suggestions);
  });

  els.tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = normalizeText(els.tagInput.value);
      if (!q) return;

      // Lägg till om den finns exakt i listan
      if (allTags.includes(q)) {
        addTag(q);
        els.tagInput.value = "";
        els.tagSuggestions.style.display = "none";
        render();
      }
    }

    if (e.key === "Escape") {
      els.tagSuggestions.style.display = "none";
    }
  });

  // Klick utanför suggestions stänger
  document.addEventListener("click", (e) => {
    const inside = e.target === els.tagInput || els.tagSuggestions.contains(e.target);
    if (!inside) els.tagSuggestions.style.display = "none";
  });

  // Rensa taggar
  els.clearTagsBtn.addEventListener("click", () => {
    state.selectedTags = [];
    els.tagSuggestions.style.display = "none";
    render();
  });

  // Viewer
  els.closeViewerBtn.addEventListener("click", closeViewer);
  els.viewer.addEventListener("click", (e) => {
    const rect = els.viewer.querySelector(".viewer-figure")?.getBoundingClientRect();
    if (!rect) return;
    const inside =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) closeViewer();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeViewer();
  });
}

async function init() {
  try {
    allImages = await loadImages();
    allTags = getAllUniqueTags(allImages); // kan vara tusentals, men visas inte – bara används för search
    wireEvents();
    render();
  } catch (err) {
    console.error(err);
    els.statusLine.textContent = "Kunde inte ladda bilder. Kontrollera data/images.json och filvägar.";
  }
}

init();
