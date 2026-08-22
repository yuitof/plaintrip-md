import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ItineraryDocument from "@/components/itinerary-document";
import { loadGitHubHome } from "@/lib/github-plan";
import { parseItinerary } from "@/lib/itinerary";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ owner: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner } = await params;
  const result = await loadGitHubHome(owner);

  if (result.status !== "ok") return { title: "Trip not found" };
  const itinerary = parseItinerary(result.source);
  return {
    title: itinerary.frontmatter.title,
    description: itinerary.frontmatter.description || `Itinerary shared by ${owner}`,
  };
}

export default async function GitHubHomePage({ params }: PageProps) {
  const { owner } = await params;
  const result = await loadGitHubHome(owner);

  if (result.status !== "ok") notFound();

  return <ItineraryDocument source={result.source} />;
}
