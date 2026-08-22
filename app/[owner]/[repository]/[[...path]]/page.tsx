import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TripDocument from "@/components/trip-document";
import { loadGitHubTrip } from "@/lib/github-plan";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ owner: string; repository: string; path?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repository, path = [] } = await params;
  const result = await loadGitHubTrip(owner, repository, path);

  if (result.status !== "ok") return { title: "Trip not found" };
  return {
    title: result.plan.title,
    description: result.plan.description || `Itinerary from ${owner}/${repository}`,
  };
}

export default async function GitHubTripPage({
  params,
}: PageProps) {
  const { owner, repository, path = [] } = await params;
  const result = await loadGitHubTrip(owner, repository, path);

  if (result.status !== "ok") notFound();

  return (
    <TripDocument
      plan={result.plan}
      breadcrumb={owner + " / " + repository}
      sourceLabel={result.repository + "/" + result.filePath}
    />
  );
}
