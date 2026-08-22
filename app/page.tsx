import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import ViewerChrome from "@/components/viewer-chrome";
import { loadGitHubTrip } from "@/lib/github-plan";
import { parseItinerary } from "@/lib/itinerary";
import { loadLocalPreview } from "@/lib/local-preview";
import { pageMetadata } from "@/lib/page-metadata";
import {
  currencyFromSearchParams,
  type ViewerSearchParams,
} from "@/lib/view-options";

export const dynamic = "force-dynamic";

const TEMPLATE_OWNER = "yuitof";
const TEMPLATE_REPOSITORY = "plaintrip-md-template";

const loadHomeSource = cache(async () => {
  const local = await loadLocalPreview();
  if (local) {
    return {
      source: local.source,
      sourceLabel: `${local.folderName}/${local.filePath}`,
      localPreviewVersion: local.version,
    };
  }

  const result = await loadGitHubTrip(TEMPLATE_OWNER, TEMPLATE_REPOSITORY);
  if (result.status !== "ok") notFound();
  return {
    source: result.source,
    sourceLabel: "yuitof/plaintrip-md-template/plaintrip.md",
    sourceRepositoryUrl: "https://github.com/yuitof/plaintrip-md-template",
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const itinerary = parseItinerary((await loadHomeSource()).source);
  return pageMetadata(
    itinerary.frontmatter.title,
    itinerary.frontmatter.description || "The PlainTrip MD itinerary template.",
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<ViewerSearchParams>;
}) {
  const [homeSource, query] = await Promise.all([
    loadHomeSource(),
    searchParams,
  ]);
  return (
    <ViewerChrome
      source={homeSource.source}
      sourceLabel={homeSource.sourceLabel}
      sourceRepositoryUrl={homeSource.sourceRepositoryUrl}
      localPreviewVersion={homeSource.localPreviewVersion}
      currencyOverride={currencyFromSearchParams(query)}
    />
  );
}
