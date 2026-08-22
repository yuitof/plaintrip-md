import type { Metadata } from "next";
import TripDocument from "@/components/trip-document";
import { getSampleTripPlan } from "@/lib/plan";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "China trip · 2026",
  description: "A sample shared itinerary rendered from Markdown.",
};

export default function Home() {
  return <TripDocument plan={getSampleTripPlan()} />;
}
