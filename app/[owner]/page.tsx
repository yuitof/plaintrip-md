import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TripDocument from "@/components/trip-document";
import { loadGitHubHome } from "@/lib/github-plan";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ owner: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner } = await params;
  const result = await loadGitHubHome(owner);

  if (result.status !== "ok") return { title: "Trip not found" };
  return {
    title: result.plan.title,
    description: result.plan.description || `Itinerary shared by ${owner}`,
  };
}

export default async function GitHubHomePage({ params }: PageProps) {
  const { owner } = await params;
  const result = await loadGitHubHome(owner);

  if (result.status !== "ok") notFound();

  return (
    <TripDocument
      plan={result.plan}
      breadcrumb={owner}
      sourceLabel={`${result.repository}/${result.filePath}`}
    />
  );
}
