import { useEffect, useId, useMemo, useState } from "react";
import * as Select from "@radix-ui/react-select";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileQuestion,
  LoaderCircle,
  PanelTop,
  Share2,
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import toast, { Toaster } from "react-hot-toast";
import ItineraryDocument from "@/components/itinerary-document";
import ViewerHeader, { VIEWER_REPOSITORY } from "@/components/viewer-header";
import {
  COMMON_CURRENCIES,
  loadExchangeRates,
  normalizeCurrency,
  type ExchangeRates,
} from "@/lib/currency";
import {
  loadGitHubHome,
  loadGitHubTrip,
  type RemoteTripResult,
} from "@/lib/github-plan";
import {
  normalizePagesBasePath,
  resolveGitHubPagesTarget,
  TEMPLATE_OWNER,
  TEMPLATE_REPOSITORY,
  type GitHubPagesTarget,
} from "@/lib/github-pages-route";
import { parseItinerary, type ParsedItinerary } from "@/lib/itinerary";
import { normalizeTimezone } from "@/lib/view-options";

type ReadyState = {
  status: "ready";
  itinerary: ParsedItinerary;
  sourceLabel: string;
  sourceRepositoryUrl: string;
  timezone: string;
};

type ErrorReason = Exclude<RemoteTripResult, { status: "ok" }>["status"] | "invalid-route";

type ViewerState =
  | { status: "loading" }
  | { status: "error"; reason: ErrorReason }
  | ReadyState;

function sourceCurrencies(itinerary: ParsedItinerary): Set<string> {
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

async function loadTarget(target: GitHubPagesTarget): Promise<RemoteTripResult> {
  if (target.kind === "template") {
    return loadGitHubTrip(TEMPLATE_OWNER, TEMPLATE_REPOSITORY);
  }
  if (target.kind === "owner") return loadGitHubHome(target.owner);
  if (target.kind === "repository") {
    return loadGitHubTrip(
      target.owner,
      target.repository,
      target.routeSegments,
    );
  }
  return { status: "invalid" };
}

function updateMetadata(title: string, description: string) {
  document.title = title;
  const values: Array<[string, string, "name" | "property"]> = [
    ["description", description, "name"],
    ["og:title", title, "property"],
    ["og:description", description, "property"],
    ["twitter:title", title, "name"],
    ["twitter:description", description, "name"],
  ];
  for (const [key, value, attribute] of values) {
    const element = document.head.querySelector<HTMLMetaElement>(
      `meta[${attribute}="${key}"]`,
    );
    if (element) element.content = value;
  }
}

function StaticCurrencyControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (currency: string) => void;
}) {
  const labelId = useId();
  const currencies = COMMON_CURRENCIES.includes(
    value as (typeof COMMON_CURRENCIES)[number],
  )
    ? COMMON_CURRENCIES
    : [value, ...COMMON_CURRENCIES];

  return (
    <div className="currency-control">
      <span className="currency-label" id={labelId}>Cur</span>
      <Select.Root onValueChange={onChange} value={value}>
        <Select.Trigger
          aria-labelledby={labelId}
          className="currency-trigger"
          title="Display currency"
        >
          <Select.Value>{value}</Select.Value>
          <Select.Icon className="currency-trigger-icon">
            <ChevronDown aria-hidden="true" size={12} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="currency-menu"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="currency-menu-viewport">
              {currencies.map((currency) => (
                <Select.Item
                  className="currency-menu-item"
                  key={currency}
                  value={currency}
                >
                  <Select.ItemText>{currency}</Select.ItemText>
                  <Select.ItemIndicator className="currency-menu-check">
                    <Check aria-hidden="true" size={12} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    try {
      textarea.select();
      if (!document.execCommand("copy")) throw new Error("Clipboard copy failed");
    } finally {
      textarea.remove();
    }
  }
}

function ShareAction() {
  async function shareUrl() {
    try {
      await copyText(window.location.href);
      toast.success("Shareable URL copied to clipboard", { position: "bottom-right" });
    } catch {
      toast.error("Failed to copy URL", { position: "bottom-right" });
    }
  }

  return (
    <>
      <div className="viewer-actions">
        <button className="toolbar-button share-button" onClick={shareUrl} type="button">
          <Share2 aria-hidden="true" size={14} />
          <span>Share URL</span>
        </button>
      </div>
      <Toaster />
    </>
  );
}

function ViewerMessage({
  baseHref,
  loading = false,
}: {
  baseHref: string;
  loading?: boolean;
}) {
  return (
    <div className="viewer-app not-found-app">
      <ViewerHeader homeHref={baseHref} />
      <section
        className="preview-panel not-found-panel"
        aria-labelledby={loading ? "loading-heading" : "not-found-heading"}
      >
        <header className="preview-panel-header">Preview</header>
        {loading ? (
          <div className="pages-loading" role="status">
            <LoaderCircle aria-hidden="true" className="pages-spinner" size={20} />
            <span id="loading-heading">Loading itinerary</span>
          </div>
        ) : (
          <div className="not-found-content">
            <div className="not-found-route" aria-hidden="true">
              <span>owner</span>
              <ChevronRight size={14} strokeWidth={1.75} />
              <span>repository</span>
              <ChevronRight size={14} strokeWidth={1.75} />
              <span className="not-found-route-missing">
                <FileQuestion size={16} strokeWidth={1.75} />
              </span>
            </div>
            <p className="not-found-status">404 · Nothing to preview here</p>
            <h1 id="not-found-heading">Itinerary not found</h1>
            <p className="not-found-copy">
              This address does not match an itinerary in the requested GitHub
              repository. Check the owner, repository, page path, or its
              <code> route.yaml</code> mappings.
            </p>
            <div className="not-found-actions">
              <a className="not-found-primary" href={baseHref}>View the template</a>
              <a
                href={`${VIEWER_REPOSITORY}#configure-routes`}
                rel="noreferrer"
                target="_blank"
              >
                <BookOpen aria-hidden="true" size={15} />
                Routing guide
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function StaticViewerApp() {
  const basePath = useMemo(
    () => normalizePagesBasePath(import.meta.env.BASE_URL),
    [],
  );
  const baseHref = basePath === "/" ? "/" : `${basePath}/`;
  const [state, setState] = useState<ViewerState>({ status: "loading" });
  const [currency, setCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>();

  useEffect(() => {
    let active = true;
    const target = resolveGitHubPagesTarget(window.location.pathname, basePath);
    if (target.kind === "invalid") {
      setState({ status: "error", reason: "invalid-route" });
      updateMetadata("Itinerary not found", "No PlainTrip MD itinerary matches this address.");
      return;
    }

    void loadTarget(target)
      .then((result) => {
        if (!active) return;
        if (result.status !== "ok") {
          setState({ status: "error", reason: result.status });
          updateMetadata("Itinerary not found", "No PlainTrip MD itinerary matches this address.");
          return;
        }

        const initial = parseItinerary(result.source);
        const documentTimezone = normalizeTimezone(initial.frontmatter.timezone);
        const deviceTimezone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const timezone = documentTimezone || deviceTimezone;
        const itinerary = documentTimezone
          ? initial
          : parseItinerary(result.source, { defaultTimezone: timezone });
        const queryCurrency = normalizeCurrency(
          new URLSearchParams(window.location.search).get("cur"),
        );
        const selectedCurrency =
          queryCurrency || normalizeCurrency(itinerary.frontmatter.currency) || "USD";
        const requestedSource = target.kind === "template"
          ? `${TEMPLATE_OWNER}/${TEMPLATE_REPOSITORY}`
          : `${target.owner}/${result.repository}`;

        setCurrency(selectedCurrency);
        setState({
          status: "ready",
          itinerary,
          sourceLabel: `${requestedSource}/${result.filePath}`,
          sourceRepositoryUrl: result.repositoryUrl,
          timezone,
        });
        updateMetadata(
          itinerary.frontmatter.title,
          itinerary.frontmatter.description || "A PlainTrip MD itinerary.",
        );
      })
      .catch(() => {
        if (!active) return;
        setState({ status: "error", reason: "upstream-error" });
        updateMetadata("Itinerary unavailable", "PlainTrip MD could not load this itinerary.");
      });

    return () => {
      active = false;
    };
  }, [basePath]);

  const currencies = state.status === "ready"
    ? sourceCurrencies(state.itinerary)
    : new Set<string>();
  const needsRates = state.status === "ready" &&
    [...currencies].some((sourceCurrency) => sourceCurrency !== currency);

  useEffect(() => {
    let active = true;
    setExchangeRates(undefined);
    if (!needsRates) return;
    void loadExchangeRates().then((rates) => {
      if (active) setExchangeRates(rates);
    });
    return () => {
      active = false;
    };
  }, [needsRates, currency]);

  function selectCurrency(nextCurrency: string) {
    setCurrency(nextCurrency);
    const url = new URL(window.location.href);
    url.searchParams.set("cur", nextCurrency);
    window.history.replaceState(null, "", url);
  }

  if (state.status === "loading") return <ViewerMessage baseHref={baseHref} loading />;
  if (state.status === "error") return <ViewerMessage baseHref={baseHref} />;

  const ratesReady = !needsRates || [...currencies, currency].every(
    (sourceCurrency) => Boolean(exchangeRates?.rates[sourceCurrency]),
  );
  const rateTimestamp = exchangeRates?.updatedAt
    ? new Date(exchangeRates.updatedAt * 1000).toISOString()
    : undefined;

  return (
    <div className="viewer-app">
      <ViewerHeader homeHref={baseHref} />
      <div className="viewer-toolbar" aria-label="Preview controls" role="toolbar">
        <div className="timezone-readout" title="Itinerary timezone">
          <span>TZ</span>
          <output>{state.timezone}</output>
        </div>
        <StaticCurrencyControl value={currency} onChange={selectCurrency} />
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
        <a
          className="toolbar-button source-button"
          href={state.sourceRepositoryUrl}
          rel="noreferrer"
          target="_blank"
          title={`Open ${state.sourceLabel} on GitHub`}
        >
          <SiGithub aria-hidden="true" size={14} />
          <span>{state.sourceLabel}</span>
          <ExternalLink aria-hidden="true" size={12} />
        </a>
        <ShareAction />
      </div>
      <section className="preview-panel" aria-labelledby="preview-heading">
        <header className="preview-panel-header" id="preview-heading">Preview</header>
        <ItineraryDocument
          itinerary={state.itinerary}
          displayCurrency={currency}
          exchangeRates={ratesReady ? exchangeRates?.rates : undefined}
        />
      </section>
    </div>
  );
}
