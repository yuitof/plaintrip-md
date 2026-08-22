import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ItineraryDocument from "@/components/itinerary-document";
import { loadGitHubTrip } from "@/lib/github-plan";
import { parseItinerary } from "@/lib/itinerary";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ owner: string; repository: string; path?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repository, path = [] } = await params;
  const result = await loadGitHubTrip(owner, repository, path);

  if (result.status !== "ok") return { title: "Trip not found" };
  const itinerary = parseItinerary(result.source);
  return {
    title: itinerary.frontmatter.title,
    description: itinerary.frontmatter.description || `Itinerary from ${owner}/${repository}`,
  };
}

export default async function GitHubTripPage({
  params,
}: PageProps) {
  const { owner, repository, path = [] } = await params;
  const result = await loadGitHubTrip(owner, repository, path);

  if (result.status !== "ok") notFound();

  return <ItineraryDocument source={result.source} />;
}
