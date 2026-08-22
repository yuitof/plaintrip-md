import { ExternalLink, Github, Info, PanelTop } from "lucide-react";
import ItineraryDocument from "@/components/itinerary-document";
import { TimezoneControl, ViewerActions } from "@/components/viewer-controls";
import { parseItinerary } from "@/lib/itinerary";

const VIEWER_REPOSITORY = "https://github.com/yuitof/plaintrip-md";

type ViewerChromeProps = {
  source: string;
  sourceLabel: string;
  sourceRepositoryUrl: string;
  timezoneOverride?: string;
};

export default function ViewerChrome({
  source,
  sourceLabel,
  sourceRepositoryUrl,
  timezoneOverride,
}: ViewerChromeProps) {
  const itinerary = parseItinerary(source);
  const selectedTimezone =
    timezoneOverride || itinerary.frontmatter.timezone || "UTC";

  return (
    <div className="viewer-app">
      <header className="viewer-header">
        <a className="viewer-brand" href="/" aria-label="PlainTrip MD home">
          <strong>PlainTrip</strong>
          <span>MD</span>
        </a>
        <nav aria-label="Project links">
          <a href={VIEWER_REPOSITORY} rel="noreferrer" target="_blank" title="PlainTrip MD on GitHub">
            <Github aria-hidden="true" size={18} />
            <span className="sr-only">PlainTrip MD on GitHub</span>
          </a>
          <a href={`${VIEWER_REPOSITORY}#readme`} rel="noreferrer" target="_blank" title="About PlainTrip MD">
            <Info aria-hidden="true" size={18} />
            <span className="sr-only">About PlainTrip MD</span>
          </a>
        </nav>
      </header>

      <div className="viewer-toolbar" aria-label="Preview controls" role="toolbar">
        <TimezoneControl initialTimezone={selectedTimezone} />
        <div className="currency-readout" title="Currency declared by this itinerary">
          <span>Cur</span>
          <output>{itinerary.frontmatter.currency}</output>
        </div>
        <div className="preview-mode" title="Read-only preview">
          <PanelTop aria-hidden="true" size={15} />
          <span className="sr-only">Read-only preview</span>
        </div>
        <div className="toolbar-spacer" />
        <a
          className="toolbar-button source-button"
          href={sourceRepositoryUrl}
          rel="noreferrer"
          target="_blank"
          title={`Open ${sourceLabel} on GitHub`}
        >
          <Github aria-hidden="true" size={14} />
          <span>{sourceLabel}</span>
          <ExternalLink aria-hidden="true" size={12} />
        </a>
        <ViewerActions source={source} />
      </div>

      <section className="preview-panel" aria-labelledby="preview-heading">
        <header className="preview-panel-header" id="preview-heading">Preview</header>
        <ItineraryDocument
          itinerary={itinerary}
          timezoneOverride={timezoneOverride}
        />
      </section>
    </div>
  );
}
