import {
  filterByCategory,
  filterByTags,
  searchImages,
  parseAndValidateJson,
  applyFilters
} from "../src/utils.js";

const images = [
  { id: "a", title: "Forest Mist", category: "nature", tags: ["forest","mist"], thumb: "t", full: "f", alt: "x" },
  { id: "b", title: "City Night", category: "city", tags: ["night","lights"], thumb: "t", full: "f", alt: "x" },
  { id: "c", title: "Cute Cat", category: "animals", tags: ["cat","home"], thumb: "t", full: "f", alt: "x" }
];

describe("filterByCategory", () => {
  test("returnerar alla när category=all", () => {
    expect(filterByCategory(images, "all")).toHaveLength(3);
  });

  test("filtrerar korrekt per kategori", () => {
    const out = filterByCategory(images, "city");
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("b");
  });
});

describe("filterByTags", () => {
  test("utan valda taggar returneras allt", () => {
    expect(filterByTags(images, [])).toHaveLength(3);
  });

  test("AND-logik: alla valda taggar måste matcha", () => {
    const out = filterByTags(images, ["forest", "mist"]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
  });

  test("ingen match ger tom array", () => {
    const out = filterByTags(images, ["forest", "lights"]);
    expect(out).toHaveLength(0);
  });
});

describe("searchImages", () => {
  test("tom query ger allt", () => {
    expect(searchImages(images, "")).toHaveLength(3);
  });

  test("sök hittar på titel", () => {
    const out = searchImages(images, "cat");
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("c");
  });

  test("sök hittar på tagg", () => {
    const out = searchImages(images, "lights");
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("b");
  });

  test("sök returnerar inte tomt om match finns", () => {
    const out = searchImages(images, "forest");
    expect(out.length).toBeGreaterThan(0);
  });
});

describe("parseAndValidateJson", () => {
  test("parsar korrekt JSON-format", () => {
    const res = parseAndValidateJson({ images });
    expect(res.ok).toBe(true);
    expect(res.images).toHaveLength(3);
    expect(res.errors).toHaveLength(0);
  });

  test("hanterar trasigt format", () => {
    const res = parseAndValidateJson({ nope: [] });
    expect(res.ok).toBe(false);
    expect(res.images).toHaveLength(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  test("validerar att obligatoriska fält finns", () => {
    const bad = { images: [{ id: "x" }] };
    const res = parseAndValidateJson(bad);
    expect(res.ok).toBe(false);
    expect(res.images).toHaveLength(0);
    expect(res.errors.join(" ")).toMatch(/Missing\/invalid/);
  });
});

describe("applyFilters", () => {
  test("kategori + sök kombineras korrekt", () => {
    const out = applyFilters(images, { category: "animals", query: "cat" });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("c");
  });

  test("kategori-val uppdaterar urvalet", () => {
    const out = applyFilters(images, { category: "nature" });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
  });
});
