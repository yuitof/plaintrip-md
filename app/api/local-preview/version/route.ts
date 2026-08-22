import { NextResponse } from "next/server";
import { loadLocalPreviewVersion } from "@/lib/local-preview";

export const dynamic = "force-dynamic";

export async function GET() {
  const version = await loadLocalPreviewVersion();
  if (version === null) {
    return NextResponse.json({ error: "Local preview is not active." }, { status: 404 });
  }
  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-store" } },
  );
}
