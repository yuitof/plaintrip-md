import type { Metadata } from "next";
import { cache } from "react";
import ItineraryDocument from "@/components/itinerary-document";
import { loadGitHubTrip } from "@/lib/github-plan";
import { getSampleItinerarySource, parseItinerary } from "@/lib/itinerary";

export const dynamic = "force-dynamic";

const TEMPLATE_OWNER = "yuitof";
const TEMPLATE_REPOSITORY = "plaintrip-md-template";

const loadTemplateSource = cache(async () => {
  const result = await loadGitHubTrip(TEMPLATE_OWNER, TEMPLATE_REPOSITORY);
  return result.status === "ok" ? result.source : getSampleItinerarySource();
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

export default async function Home() {
  return <ItineraryDocument source={await loadTemplateSource()} />;
}
