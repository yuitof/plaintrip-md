import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import ViewerChrome from "@/components/viewer-chrome";
import { loadGitHubTrip } from "@/lib/github-plan";
import { parseItinerary } from "@/lib/itinerary";
import {
  currencyFromSearchParams,
  type ViewerSearchParams,
} from "@/lib/view-options";

export const dynamic = "force-dynamic";

const TEMPLATE_OWNER = "yuitof";
const TEMPLATE_REPOSITORY = "plaintrip-md-template";

const loadTemplateSource = cache(async () => {
  const result = await loadGitHubTrip(TEMPLATE_OWNER, TEMPLATE_REPOSITORY);
  if (result.status !== "ok") notFound();
  return result.source;
});

export async function generateMetadata(): Promise<Metadata> {
  const itinerary = parseItinerary(await loadTemplateSource());
  return {
    title: itinerary.frontmatter.title,
    description:
      itinerary.frontmatter.description ||
      "The PlainTrip MD itinerary template.",
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<ViewerSearchParams>;
}) {
  const [source, query] = await Promise.all([
    loadTemplateSource(),
    searchParams,
  ]);
  return (
    <ViewerChrome
      source={source}
      sourceLabel="yuitof/plaintrip-md-template/plaintrip.md"
      sourceRepositoryUrl="https://github.com/yuitof/plaintrip-md-template"
      currencyOverride={currencyFromSearchParams(query)}
    />
  );
}
