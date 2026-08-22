import { ExternalLink, FileText, PanelTop } from "lucide-react";
import { cookies } from "next/headers";
import { SiGithub } from "react-icons/si";
import ItineraryDocument from "@/components/itinerary-document";
import LocalPreviewRefresh from "@/components/local-preview-refresh";
import ViewerHeader from "@/components/viewer-header";
import {
  CurrencyControl,
  TimezoneReadout,
  ViewerActions,
} from "@/components/viewer-controls";
import {
  loadExchangeRates,
  normalizeCurrency,
} from "@/lib/currency";
import { parseItinerary } from "@/lib/itinerary";
import {
  DEVICE_TIMEZONE_COOKIE,
  normalizeTimezone,
  timezoneFromCookie,
} from "@/lib/view-options";

type ViewerChromeProps = {
  source: string;
  sourceLabel: string;
  sourceRepositoryUrl?: string;
  localPreviewVersion?: number;
  currencyOverride?: string;
};

function itineraryCurrencies(
  itinerary: ReturnType<typeof parseItinerary>,
): Set<string> {
  const currencies = new Set<string>();
  const frontmatterCurrency = normalizeCurrency(itinerary.frontmatter.currency);
  if (frontmatterCurrency) currencies.add(frontmatterCurrency);
  for (const node of itinerary.root.children) {
    if (node.type !== "itmdEvent") continue;
    for (const entry of node.data?.itmdPrice ?? []) {
      for (const token of entry.price.tokens ?? []) {
        if (token.kind !== "money") continue;
        const currency = normalizeCurrency(
          token.normalized?.currency ?? token.currency,
        );
        if (currency) currencies.add(currency);
      }
    }
  }
  return currencies;
}

export default async function ViewerChrome({
  source,
  sourceLabel,
  sourceRepositoryUrl,
  localPreviewVersion,
  currencyOverride,
}: ViewerChromeProps) {
  const initialItinerary = parseItinerary(source);
  const documentTimezone = normalizeTimezone(
    initialItinerary.frontmatter.timezone,
  );
  const deviceTimezone = documentTimezone
    ? undefined
    : timezoneFromCookie(
        (await cookies()).get(DEVICE_TIMEZONE_COOKIE)?.value,
      );
  const selectedTimezone = documentTimezone || deviceTimezone || "UTC";
  const itinerary = documentTimezone
    ? initialItinerary
    : parseItinerary(source, { defaultTimezone: selectedTimezone });
  const selectedCurrency =
    normalizeCurrency(currencyOverride) ||
    normalizeCurrency(itinerary.frontmatter.currency) ||
    "USD";
  const sourceCurrencies = itineraryCurrencies(itinerary);
  const needsRates = [...sourceCurrencies].some(
    (currency) => currency !== selectedCurrency,
  );
  const exchangeRates = needsRates ? await loadExchangeRates() : undefined;
  const ratesReady =
    !needsRates ||
    ([...sourceCurrencies, selectedCurrency].every(
      (currency) => Boolean(exchangeRates?.rates[currency]),
    ));
  const rateTimestamp = exchangeRates?.updatedAt
    ? new Date(exchangeRates.updatedAt * 1000).toISOString()
    : undefined;

  return (
    <div className="viewer-app">
      {localPreviewVersion === undefined ? null : (
        <LocalPreviewRefresh version={localPreviewVersion} />
      )}
      <ViewerHeader />

      <div className="viewer-toolbar" aria-label="Preview controls" role="toolbar">
        <TimezoneReadout
          detectDevice={!documentTimezone}
          timezone={selectedTimezone}
        />
        <CurrencyControl initialCurrency={selectedCurrency} />
        {needsRates ? (
          <span
            className="rate-status"
            data-ready={ratesReady}
            title={ratesReady
              ? `Approximate exchange rates${rateTimestamp ? ` updated ${rateTimestamp}` : ""}`
              : "Exchange rates unavailable; original currency values are shown"}
          >
            {ratesReady ? "Approx." : "Rates unavailable"}
          </span>
        ) : null}
        <div className="preview-mode" title="Read-only preview">
          <PanelTop aria-hidden="true" size={15} />
          <span className="sr-only">Read-only preview</span>
        </div>
        <div className="toolbar-spacer" />
        {sourceRepositoryUrl ? (
          <a
            className="toolbar-button source-button"
            href={sourceRepositoryUrl}
            rel="noreferrer"
            target="_blank"
            title={`Open ${sourceLabel} on GitHub`}
          >
            <SiGithub aria-hidden="true" size={14} />
            <span>{sourceLabel}</span>
            <ExternalLink aria-hidden="true" size={12} />
          </a>
        ) : (
          <span
            className="toolbar-button source-button"
            title={`Local source: ${sourceLabel}`}
          >
            <FileText aria-hidden="true" size={14} />
            <span>{sourceLabel}</span>
          </span>
        )}
        <ViewerActions />
      </div>

      <section className="preview-panel" aria-labelledby="preview-heading">
        <header className="preview-panel-header" id="preview-heading">Preview</header>
        <ItineraryDocument
          itinerary={itinerary}
          displayCurrency={selectedCurrency}
          exchangeRates={ratesReady ? exchangeRates?.rates : undefined}
        />
      </section>
    </div>
  );
}
