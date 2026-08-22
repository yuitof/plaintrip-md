import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ViewerChrome from "@/components/viewer-chrome";
import { loadGitHubTrip } from "@/lib/github-plan";
import { parseItinerary } from "@/lib/itinerary";
import { pageMetadata } from "@/lib/page-metadata";
import {
  currencyFromSearchParams,
  type ViewerSearchParams,
} from "@/lib/view-options";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ owner: string; repository: string; path?: string[] }>;
  searchParams: Promise<ViewerSearchParams>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repository, path = [] } = await params;
  const result = await loadGitHubTrip(owner, repository, path);

  if (result.status !== "ok") return { title: "Trip not found" };
  const itinerary = parseItinerary(result.source);
  return pageMetadata(
    itinerary.frontmatter.title,
    itinerary.frontmatter.description || `Itinerary from ${owner}/${repository}`,
  );
}

export default async function GitHubTripPage({
  params,
  searchParams,
}: PageProps) {
  const [{ owner, repository, path = [] }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const result = await loadGitHubTrip(owner, repository, path);

  if (result.status !== "ok") notFound();

  return (
    <ViewerChrome
      source={result.source}
      sourceLabel={`${owner}/${result.repository}/${result.filePath}`}
      sourceRepositoryUrl={result.repositoryUrl}
      currencyOverride={currencyFromSearchParams(query)}
    />
  );
}
