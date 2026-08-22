import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/page-metadata";
import "./globals.css";

export const metadata: Metadata = pageMetadata(
  "PlainTrip MD",
  "Read-only Markdown itineraries that stay in sync with GitHub.",
);

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
