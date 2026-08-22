import fs from "node:fs";
import type { PhrasingContent, Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkItinerary from "remark-itinerary";
import remarkItineraryAlert from "remark-itinerary-alert";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";

export type ItineraryFrontmatter = {
  type?: string;
  title: string;
  description: string;
  tags: string[];
  budget?: string | number;
  currency: string;
  timezone?: string;
  updated?: string;
};

export type ItineraryEventNode = {
  type: "itmdEvent";
  eventType: string;
  baseType?: "transportation" | "stay" | "activity";
  title?: PhrasingContent[] | null;
  title_alt?: PhrasingContent[] | null;
  destination?:
    | {
        kind: "single";
        at: PhrasingContent[];
        at_alt?: PhrasingContent[] | null;
      }
    | {
        kind: "dashPair" | "fromTo";
        from: PhrasingContent[];
        to: PhrasingContent[];
        vias?: PhrasingContent[][];
        from_alt?: PhrasingContent[] | null;
        to_alt?: PhrasingContent[] | null;
      }
    | null;
  time?:
    | { kind: "none" }
    | { kind: "marker"; marker: "am" | "pm" }
    | {
        kind: "point";
        start?: ItineraryClockTime;
        startISO?: string | null;
      }
    | {
        kind: "range";
        start?: ItineraryClockTime;
        end?: ItineraryClockTime;
        startISO?: string | null;
        endISO?: string | null;
      };
  body?: Array<
    | { kind: "inline"; content: PhrasingContent[] }
    | {
        kind: "meta";
        entries: Array<{ key: string; value: PhrasingContent[] }>;
      }
    | {
        kind: "list";
        items: PhrasingContent[][];
        ordered?: boolean;
        start?: number | null;
      }
  > | null;
  data?: {
    hProperties?: Record<string, unknown>;
    itmdPrice?: Array<{
      key: string;
      raw: string;
      price: {
        tokens?: Array<{
          kind?: string;
          currency?: string;
          amount?: string;
          normalized?: { currency?: string; amount?: string };
        }>;
      };
    }>;
  };
};

type ItineraryClockTime = {
  hh: number;
  mm: number;
  tz?: string | null;
  dayOffset?: number | null;
};

export type ItineraryHeadingNode = {
  type: "itmdHeading";
  dateISO: string;
  timezone?: string;
};

export type ItineraryAlertNode = {
  type: "itmdAlert";
  variant: "note" | "tip" | "important" | "warning" | "caution";
  title?: string;
  inlineTitle?: PhrasingContent[];
  children?: ItineraryNode[];
};

export type ItineraryNode =
  | RootContent
  | ItineraryEventNode
  | ItineraryHeadingNode
  | ItineraryAlertNode;

export type ParsedItinerary = {
  frontmatter: ItineraryFrontmatter;
  root: Omit<Root, "children"> & { children: ItineraryNode[] };
};

function stringValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return undefined;
}

function tagsValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((tag) => stringValue(tag))
      .filter((tag): tag is string => Boolean(tag));
  }
  const single = stringValue(value);
  return single ? [single] : [];
}

function splitFrontmatter(source: string): {
  content: string;
  data: Record<string, unknown>;
} {
  const match = source.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match) return { content: source, data: {} };
  const value = parseYaml(match[1]) as unknown;
  return {
    content: source.slice(match[0].length),
    data: value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {},
  };
}

export function parseItinerary(source: string): ParsedItinerary {
  const parsed = splitFrontmatter(source);
  const rawType = stringValue(parsed.data.type)?.toLowerCase();
  const isItinerary =
    rawType === "tripmd" || rawType === "itmd" || rawType === "itinerary-md";
  const timezone = stringValue(parsed.data.timezone);
  const currency = stringValue(parsed.data.currency)?.toUpperCase() ?? "USD";
  const processor = unified().use(remarkParse).use(remarkGfm);

  if (isItinerary) {
    processor
      .use(remarkItineraryAlert)
      .use(remarkItinerary, {
        defaultTimezone: timezone,
        defaultCurrency: currency,
      });
  }

  const root = processor.runSync(processor.parse(parsed.content)) as Omit<Root, "children"> & {
    children: ItineraryNode[];
  };

  return {
    frontmatter: {
      type: rawType,
      title: stringValue(parsed.data.title) ?? "Untitled itinerary",
      description: stringValue(parsed.data.description) ?? "",
      tags: tagsValue(parsed.data.tags),
      budget:
        typeof parsed.data.budget === "number"
          ? parsed.data.budget
          : stringValue(parsed.data.budget),
      currency,
      timezone,
      updated: stringValue(parsed.data.updated),
    },
    root,
  };
}

export function getSampleItinerarySource(): string {
  return fs.readFileSync("sample-travel-plan.md", "utf8");
}
