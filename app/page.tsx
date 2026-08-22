import type { Metadata } from "next";
import ItineraryDocument from "@/components/itinerary-document";
import { getSampleItinerarySource } from "@/lib/itinerary";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "China trip · 2026",
  description: "A sample shared itinerary rendered from Markdown.",
};

export default function Home() {
  return <ItineraryDocument source={getSampleItinerarySource()} />;
}
