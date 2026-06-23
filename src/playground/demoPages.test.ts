import { describe, it, expect } from "vitest";
import { getPage, DEMO_PAGES, type DemoPage } from "./demoPages";

const FAKE_PAGES: DemoPage[] = [
  { id: "page-a", title: "Page A", html: "<p>Hello</p>" },
  { id: "page-b", title: "Page B", html: "<p>World</p>" },
];

describe("getPage", () => {
  it("returns the matching page", () => {
    const p = getPage(FAKE_PAGES, "page-a");
    expect(p.id).toBe("page-a");
    expect(p.title).toBe("Page A");
    expect(p.html).toBe("<p>Hello</p>");
  });

  it("throws on unknown id", () => {
    expect(() => getPage(FAKE_PAGES, "nope")).toThrow("unknown demo page id: nope");
  });

  it("returns the second page correctly", () => {
    const p = getPage(FAKE_PAGES, "page-b");
    expect(p.id).toBe("page-b");
  });
});

describe("DEMO_PAGES", () => {
  it("has at least 2 pages", () => {
    expect(DEMO_PAGES.length).toBeGreaterThanOrEqual(2);
  });

  it("all pages have id, title, and html", () => {
    for (const p of DEMO_PAGES) {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.html).toBeTruthy();
    }
  });

  it("all ids are unique", () => {
    const ids = DEMO_PAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all html strings contain actual HTML content", () => {
    for (const p of DEMO_PAGES) {
      expect(p.html).toMatch(/<[a-z]/);
    }
  });
});
