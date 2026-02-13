import {
  filterByCategory,
  filterByTags,
  searchImages,
  parseAndValidateJson,
  applyFilters,
  normalizeText,
  getTopTags,
  getAllUniqueTags,
  suggestTags
} from "../src/utils.js";

const images = [
  { id: "a", title: "Forest Mist", category: "nature", tags: ["forest", "mist"], thumb: "t", full: "f", alt: "x" },
  { id: "b", title: "City Night", category: "city", tags: ["night", "lights"], thumb: "t", full: "f", alt: "x" },
  { id: "c", title: "Cute Cat", category: "animals", tags: ["cat", "home"], thumb: "t", full: "f", alt: "x" }
];

describe("normalizeText", () => {
  test("returns a lowercase trimmed string", () => {
    expect(normalizeText("  HeLLo World  ")).toBe("hello world");
  });

  test("handles null and undefined", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });

  test("handles empty string", () => {
    expect(normalizeText("")).toBe("");
  });
});

describe("filterByCategory", () => {
  test("returns all items when category=all", () => {
    expect(filterByCategory(images, "all")).toHaveLength(3);
  });

  test("filters correctly by category", () => {
    const out = filterByCategory(images, "city");
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("b");
  });
});

describe("filterByTags", () => {
  test("returns all items when no tags are selected", () => {
    expect(filterByTags(images, [])).toHaveLength(3);
  });

  test("uses AND logic: all selected tags must match", () => {
    const out = filterByTags(images, ["forest", "mist"]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
  });

  test("returns an empty array when nothing matches", () => {
    const out = filterByTags(images, ["forest", "lights"]);
    expect(out).toHaveLength(0);
  });
});

describe("searchImages", () => {
  test("returns all items when query is empty", () => {
    expect(searchImages(images, "")).toHaveLength(3);
  });

  test("finds matches in the title", () => {
    const out = searchImages(images, "cat");
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("c");
  });

  test("finds matches in tags", () => {
    const out = searchImages(images, "lights");
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("b");
  });

  test("does not return empty when a match exists", () => {
    const out = searchImages(images, "forest");
    expect(out.length).toBeGreaterThan(0);
  });
});

describe("parseAndValidateJson", () => {
  test("parses a valid JSON shape", () => {
    const res = parseAndValidateJson({ images });
    expect(res.ok).toBe(true);
    expect(res.images).toHaveLength(3);
    expect(res.errors).toHaveLength(0);
  });

  test("handles invalid JSON shape", () => {
    const res = parseAndValidateJson({ nope: [] });
    expect(res.ok).toBe(false);
    expect(res.images).toHaveLength(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  test("validates that required fields exist", () => {
    const bad = { images: [{ id: "x" }] };
    const res = parseAndValidateJson(bad);
    expect(res.ok).toBe(false);
    expect(res.images).toHaveLength(0);
    expect(res.errors.join(" ")).toMatch(/Missing\/invalid/);
  });
});

describe("applyFilters", () => {
  test("combines category + search correctly", () => {
    const out = applyFilters(images, { category: "animals", query: "cat" });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("c");
  });

  test("category selection updates the result", () => {
    const out = applyFilters(images, { category: "nature" });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
  });
});

describe("getTopTags", () => {
  const imgs = [
    { tags: ["cat", "cute"] },
    { tags: ["cat", "animal"] },
    { tags: ["animal", "cute"] },
    { tags: ["cat"] }
  ];

  test("returns the most frequent tags", () => {
    const top = getTopTags(imgs, 2);
    expect(top).toEqual(["cat", "animal"]);
  });

  test("returns all tags if n is large", () => {
    const top = getTopTags(imgs, 10);
    expect(top).toEqual(expect.arrayContaining(["cat", "cute", "animal"]));
  });

  test("returns an empty array when there are no images", () => {
    expect(getTopTags([], 5)).toEqual([]);
  });
});

describe("getAllUniqueTags", () => {
  const imgs = [
    { tags: ["cat", "cute"] },
    { tags: ["cat", "animal"] },
    { tags: ["animal", "cute"] },
    { tags: ["cat"] }
  ];

  test("returns sorted unique tags", () => {
    const unique = getAllUniqueTags(imgs);
    expect(unique).toEqual(["animal", "cat", "cute"]);
  });

  test("returns an empty array when there are no images", () => {
    expect(getAllUniqueTags([])).toEqual([]);
  });
});

describe("suggestTags", () => {
  const allTags = ["cat", "cute", "animal", "dog", "wild"];

  test("suggests tags containing the input substring", () => {
    const suggestions = suggestTags(allTags, [], "c");
    expect(suggestions).toEqual(["cat", "cute"]);
  });

  test("does not suggest already selected tags", () => {
    const suggestions = suggestTags(allTags, ["cat"], "c");
    expect(suggestions).toEqual(["cute"]);
  });

  test("returns an empty array when input is empty", () => {
    expect(suggestTags(allTags, [], "")).toEqual([]);
  });

  test("respects the limit", () => {
    const suggestions = suggestTags(allTags, [], "a", 1);
    expect(suggestions).toEqual(["cat"]);
  });
});
