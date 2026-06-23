import rawPages from "../../data/pages.json";

export interface DemoPage {
  id: string;
  title: string;
  html: string;
}

export const DEMO_PAGES: DemoPage[] = rawPages as DemoPage[];

export function getPage(pages: DemoPage[], id: string): DemoPage {
  const page = pages.find((p) => p.id === id);
  if (!page) throw new Error(`unknown demo page id: ${id}`);
  return page;
}
