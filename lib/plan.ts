import fs from "node:fs";
import path from "node:path";

export type TripEvent = {
  time: string;
  plan: string;
  details: string;
  status: string;
};

export type TripDay = {
  title: string;
  date: string;
  timezone: string;
  events: TripEvent[];
  note?: string;
};

export type IdeaGroup = {
  title: string;
  ideas: string[];
};

export type TripPlan = {
  title: string;
  description: string;
  budget: string;
  updated: string;
  checklist: string[];
  days: TripDay[];
  ideas: IdeaGroup[];
  practicalNotes: string[];
};

function cleanInline(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\\\|/g, "|")
    .trim();
}

function readFrontmatter(source: string): Record<string, string> {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  return Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/))
      .filter((entry): entry is RegExpMatchArray => Boolean(entry))
      .map((entry) => [entry[1], entry[2]]),
  );
}

function section(source: string, heading: string, nextHeading?: string): string {
  const start = source.indexOf(`## ${heading}`);
  if (start < 0) return "";
  const from = start + heading.length + 3;
  const end = nextHeading ? source.indexOf(`## ${nextHeading}`, from) : -1;
  return source.slice(from, end >= 0 ? end : undefined).trim();
}

function listItems(source: string): string[] {
  return source
    .split("\n")
    .filter((line) => /^- (?:\[[ x]\] )?/.test(line))
    .map((line) => cleanInline(line.replace(/^- (?:\[[ x]\] )?/, "")));
}

function parseDays(source: string): TripDay[] {
  const blocks = source.split(/^### /m).slice(1);

  return blocks.map((block) => {
    const lines = block.split("\n");
    const title = cleanInline(lines.shift() ?? "");
    const metaIndex = lines.findIndex((line) => /^`\d{4}-\d{2}-\d{2}`/.test(line));
    const meta = metaIndex >= 0 ? lines[metaIndex] : "";
    const [date = "", timezone = ""] = meta
      .split("·")
      .map((item) => cleanInline(item));
    const tableRows = lines.filter((line) => /^\|.+\|$/.test(line));
    const dataRows = tableRows.slice(2);
    const events = dataRows.map((row) => {
      const cells = row
        .split("|")
        .slice(1, -1)
        .map(cleanInline);
      return {
        time: cells[0] ?? "",
        plan: cells[1] ?? "",
        details: cells[2] ?? "",
        status: cells[3] ?? "",
      };
    });
    const note = lines.find((line) => line.startsWith("**Branch:**"));

    return {
      title,
      date,
      timezone,
      events,
      note: note ? cleanInline(note.replace("**Branch:**", "")) : undefined,
    };
  });
}

function parseIdeaGroups(source: string): IdeaGroup[] {
  return source
    .split(/^### /m)
    .slice(1)
    .map((block) => {
      const lines = block.split("\n");
      return {
        title: cleanInline(lines.shift() ?? ""),
        ideas: listItems(lines.join("\n")),
      };
    })
    .filter((group) => group.title && group.ideas.length);
}

export function getTripPlan(): TripPlan {
  const file = path.join(process.cwd(), "travel-plan.md");
  const source = fs.readFileSync(file, "utf8");
  const meta = readFrontmatter(source);

  return {
    title: meta.title ?? "China trip · 2026",
    description: meta.description ?? "",
    budget: meta.budget ?? "150,000 JPY",
    updated: meta.updated ?? "",
    checklist: listItems(section(source, "Before you go", "Itinerary")),
    days: parseDays(section(source, "Itinerary", "Ideas to discuss")),
    ideas: parseIdeaGroups(section(source, "Ideas to discuss", "Practical notes")),
    practicalNotes: listItems(section(source, "Practical notes")),
  };
}
