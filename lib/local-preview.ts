import "server-only";

export type LocalPreview = {
  source: string;
  filePath: string;
  folderName: string;
  version: number;
};

function localPreviewUrl() {
  return process.env.PLAINTRIP_LOCAL_PREVIEW_URL;
}

function isLocalPreview(value: unknown): value is LocalPreview {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocalPreview>;
  return (
    typeof candidate.source === "string" &&
    typeof candidate.filePath === "string" &&
    typeof candidate.folderName === "string" &&
    typeof candidate.version === "number"
  );
}

export async function loadLocalPreview(): Promise<LocalPreview | null> {
  const baseUrl = localPreviewUrl();
  if (!baseUrl) return null;

  const response = await fetch(`${baseUrl}/plan`, { cache: "no-store" });
  const value = await response.json() as unknown;
  if (!response.ok) {
    const message = value && typeof value === "object" && "error" in value
      ? String(value.error)
      : "Unable to load the local itinerary.";
    throw new Error(message);
  }
  if (!isLocalPreview(value)) {
    throw new Error("The local itinerary service returned an invalid response.");
  }
  return value;
}

export async function loadLocalPreviewVersion(): Promise<number | null> {
  const baseUrl = localPreviewUrl();
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl}/version`, { cache: "no-store" });
  if (!response.ok) return null;
  const value = await response.json() as { version?: unknown };
  return typeof value.version === "number" ? value.version : null;
}
