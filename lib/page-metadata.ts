import type { Metadata } from "next";

export function pageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "PlainTrip MD",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
