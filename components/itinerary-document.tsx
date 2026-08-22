import type { CSSProperties, ReactNode } from "react";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Armchair,
  Bed,
  BedDouble,
  Building2,
  Bus,
  CableCar,
  Calendar,
  Camera,
  Car,
  CarTaxiFront,
  CircleUser,
  Clock,
  Coffee,
  FerrisWheel,
  Globe,
  Handshake,
  Info,
  Landmark,
  Lightbulb,
  Link as LinkIcon,
  Luggage,
  Mail,
  Map as MapIcon,
  MapPin,
  Notebook,
  Phone,
  Plane,
  PlaneTakeoff,
  Rocket,
  Ruler,
  Ship,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Ticket,
  Train,
  TreePine,
  Users,
  UtensilsCrossed,
  Wallet,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type {
  Blockquote,
  Code,
  Heading,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Table,
} from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import {
  type ItineraryAlertNode,
  type ItineraryEventNode,
  type ItineraryFrontmatter,
  type ItineraryHeadingNode,
  type ItineraryNode,
  type ItineraryPriceInfo,
  type ParsedItinerary,
} from "@/lib/itinerary";

type RenderContext = {
  displayCurrency: string;
  exchangeRates?: Record<string, number>;
  timezone?: string;
};

const eventIcons: Record<string, LucideIcon> = {
  flight: Plane,
  train: Train,
  drive: Car,
  ferry: Ship,
  bus: Bus,
  taxi: CarTaxiFront,
  subway: Train,
  cablecar: CableCar,
  rocket: Rocket,
  spaceship: Rocket,
  stay: Building2,
  hotel: Building2,
  dormitory: Bed,
  hostel: Bed,
  ryokan: Landmark,
  meal: UtensilsCrossed,
  lunch: UtensilsCrossed,
  dinner: UtensilsCrossed,
  breakfast: UtensilsCrossed,
  brunch: UtensilsCrossed,
  museum: Landmark,
  sightseeing: FerrisWheel,
  shoot: Camera,
  shopping: ShoppingBag,
  spa: Sparkles,
  park: TreePine,
  cafe: Coffee,
  meeting: Handshake,
};

const metadataIcons: Record<string, LucideIcon> = {
  cost: Wallet,
  price: Wallet,
  seat: Armchair,
  room: Bed,
  guests: Users,
  aircraft: Plane,
  vehicle: Car,
  location: MapPin,
  addr: MapPin,
  address: MapPin,
  phone: Phone,
  tel: Phone,
  wifi: Wifi,
  rating: Star,
  reservation: Calendar,
  checkin: PlaneTakeoff,
  checkout: PlaneTakeoff,
  class: Star,
  reference: Ticket,
  duration: Clock,
  distance: Ruler,
  gate: PlaneTakeoff,
  terminal: PlaneTakeoff,
  baggage: Luggage,
  contact: CircleUser,
  mail: Mail,
  email: Mail,
  web: Globe,
  website: Globe,
  url: Globe,
  link: Globe,
  note: Notebook,
  status: Tag,
};

const palettes = {
  transportation: ["#dc2626", "#ea580c", "#d97706", "#ca8a04"],
  stay: ["#9333ea"],
  activity: [
    "#d97706",
    "#65a30d",
    "#16a34a",
    "#059669",
    "#0d9488",
    "#0891b2",
    "#2563eb",
    "#db2777",
    "#4b5563",
  ],
};

function hash(value: string): number {
  let result = 0;
  for (const character of value) result = (result * 31 + character.charCodeAt(0)) >>> 0;
  return result;
}

function accentFor(event: ItineraryEventNode): string {
  const family = event.baseType ?? "activity";
  const colors = palettes[family];
  return colors[hash(event.eventType || "activity") % colors.length];
}

function safeHref(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

function renderInline(nodes?: PhrasingContent[] | null): ReactNode {
  if (!Array.isArray(nodes)) return null;
  return nodes.map((node, index) => {
    const key = `${node.type}-${index}`;
    if (node.type === "text") return node.value;
    if (node.type === "strong") return <strong key={key}>{renderInline(node.children)}</strong>;
    if (node.type === "emphasis") return <em key={key}>{renderInline(node.children)}</em>;
    if (node.type === "delete") return <del key={key}>{renderInline(node.children)}</del>;
    if (node.type === "inlineCode") return <code key={key}>{node.value}</code>;
    if (node.type === "break") return <br key={key} />;
    if (node.type === "link") {
      const href = safeHref(node.url);
      if (!href) return <span key={key}>{renderInline(node.children)}</span>;
      return (
        <a href={href} key={key} rel="noreferrer" target="_blank">
          <span>{renderInline(node.children)}</span>
          <LinkIcon aria-hidden="true" size={14} />
        </a>
      );
    }
    if (node.type === "image") {
      const href = safeHref(node.url);
      return href ? <a href={href} key={key}>{node.alt || "Image"}</a> : node.alt;
    }
    if ("children" in node) return <span key={key}>{renderInline(node.children as PhrasingContent[])}</span>;
    return null;
  });
}

function plainText(nodes?: PhrasingContent[] | null): string {
  if (!nodes) return "";
  return mdastToString({ type: "paragraph", children: nodes }).trim();
}

function Location({ nodes }: { nodes?: PhrasingContent[] | null }) {
  if (!nodes?.length) return null;
  const hasLink = nodes.some((node) => node.type === "link");
  if (hasLink) return <span className="location">{renderInline(nodes)}</span>;
  const text = plainText(nodes);
  if (!text) return null;
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
  return (
    <a className="location" href={href} rel="noreferrer" target="_blank">
      <span>{renderInline(nodes)}</span>
      <MapIcon aria-hidden="true" size={15} />
    </a>
  );
}

function formatTime(iso: string | null | undefined, timezone?: string): string | undefined {
  if (!iso) return undefined;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    }).format(new Date(iso));
  } catch {
    return undefined;
  }
}

function formatClockTime(
  value: { hh: number; mm: number; dayOffset?: number | null } | undefined,
): string | undefined {
  if (!value) return undefined;
  const clock = `${String(value.hh).padStart(2, "0")}:${String(value.mm).padStart(2, "0")}`;
  return value.dayOffset ? `${clock} +${value.dayOffset}` : clock;
}

function eventTimes(event: ItineraryEventNode, context: RenderContext) {
  if (event.time?.kind === "marker") {
    return { start: event.time.marker.toUpperCase(), end: undefined };
  }
  if (event.time?.kind === "point") {
    return {
      start:
        formatClockTime(event.time.start) ??
        formatTime(event.time.startISO, context.timezone),
      end: undefined,
    };
  }
  if (event.time?.kind === "range") {
    return {
      start:
        formatClockTime(event.time.start) ??
        formatTime(event.time.startISO, context.timezone),
      end:
        formatClockTime(event.time.end) ??
        formatTime(event.time.endISO, context.timezone),
    };
  }
  return { start: undefined, end: undefined };
}

function labelFor(key: string): string {
  return key
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function displayPriceLabel(
  priceInfo: ItineraryPriceInfo | undefined,
  context: RenderContext,
): string | undefined {
  if (!priceInfo) return undefined;
  const originals: Array<{ amount: number; currency: string }> = [];
  for (const token of priceInfo.price.tokens ?? []) {
    if (token.kind !== "money") continue;
    const currency = (token.normalized?.currency ?? token.currency)?.toUpperCase();
    const amount = Number(token.normalized?.amount ?? token.amount);
    if (!currency || !Number.isFinite(amount)) continue;
    originals.push({ amount, currency });
  }
  if (!originals.length) return undefined;
  let convertedTotal = 0;
  for (const original of originals) {
    const converted = convertCurrency(
      original.amount,
      original.currency,
      context.displayCurrency,
      context.exchangeRates,
    );
    if (converted === undefined) {
      return originals
        .map(({ amount, currency }) => formatCurrency(amount, currency))
        .join(" + ");
    }
    convertedTotal += converted;
  }
  const convertedLabel = formatCurrency(convertedTotal, context.displayCurrency);
  if (originals.every(({ currency }) => currency === context.displayCurrency)) {
    return convertedLabel;
  }
  const originalLabel = originals
    .map(({ amount, currency }) => formatCurrency(amount, currency))
    .join(" + ");
  return `${convertedLabel} (${originalLabel})`;
}

function EventBody({
  event,
  accent,
  context,
}: {
  event: ItineraryEventNode;
  accent: string;
  context: RenderContext;
}) {
  if (!event.body?.length) return null;
  let priceIndex = 0;
  return (
    <div className="event-body" style={{ borderColor: accent }}>
      {event.body.map((segment, index) => {
        if (segment.kind === "inline") {
          return <p key={index}>{renderInline(segment.content)}</p>;
        }
        if (segment.kind === "meta") {
          return (
            <div className="event-meta" key={index}>
              {segment.entries.map((entry, entryIndex) => {
                const normalizedKey = entry.key.toLowerCase().replaceAll("-", "");
                const Icon = metadataIcons[normalizedKey] ?? Tag;
                const isPrice = normalizedKey === "price" || normalizedKey === "cost";
                const priceInfo = isPrice
                  ? event.data?.itmdPrice?.[priceIndex++]
                  : undefined;
                const calculatedPrice = displayPriceLabel(priceInfo, context);
                return (
                  <span className={isPrice ? "price" : undefined} key={`${entry.key}-${entryIndex}`}>
                    <Icon aria-hidden="true" size={14} />
                    {!isPrice ? <b>{labelFor(entry.key)}:</b> : null}
                    {calculatedPrice ? (
                      <span title={`Based on ${priceInfo?.raw}`}>{calculatedPrice}</span>
                    ) : renderInline(entry.value)}
                  </span>
                );
              })}
            </div>
          );
        }
        const ListTag = segment.ordered ? "ol" : "ul";
        return (
          <ListTag key={index} start={segment.start ?? undefined}>
            {segment.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
          </ListTag>
        );
      })}
    </div>
  );
}

function EventBlock({ event, context }: { event: ItineraryEventNode; context: RenderContext }) {
  const Icon = eventIcons[event.eventType] ?? MapPin;
  const accent = accentFor(event);
  const times = eventTimes(event, context);
  const destination = event.destination;
  const from = destination && destination.kind !== "single" ? destination.from : undefined;
  const to = destination && destination.kind !== "single" ? destination.to : undefined;
  const at = destination?.kind === "single" ? destination.at : undefined;
  const title = event.title?.length ? event.title : null;
  const style = { "--event-accent": accent } as CSSProperties;

  return (
    <div className="itmd-event" style={style}>
      <div className="event-time event-time-start">{times.start}</div>
      <div className="event-icon"><Icon aria-hidden="true" size={16} /></div>
      <div className="event-location event-location-start"><Location nodes={from ?? at} /></div>
      <div className="event-track" aria-hidden="true" />
      <div className="event-content">
        <h3>{title ? renderInline(title) : labelFor(event.eventType)}</h3>
        <EventBody accent={accent} context={context} event={event} />
      </div>
      <div className="event-time event-time-end">{times.end}</div>
      <div className="event-dot" aria-hidden="true" />
      <div className="event-location event-location-end"><Location nodes={to} /></div>
    </div>
  );
}

function DateHeading({ node, fallbackTimezone }: { node: ItineraryHeadingNode; fallbackTimezone?: string }) {
  const timezone = node.timezone || fallbackTimezone;
  let weekday = "";
  try {
    weekday = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: timezone ?? "UTC" })
      .format(new Date(`${node.dateISO}T12:00:00Z`));
  } catch {}
  return (
    <h2 className="itmd-date">
      <span>{node.dateISO}</span>
      {weekday ? <small data-day={weekday}>{weekday}</small> : null}
      {timezone ? <i>({timezone})</i> : null}
    </h2>
  );
}

function AlertBlock({ node, context }: { node: ItineraryAlertNode; context: RenderContext }) {
  const icons: Record<string, LucideIcon> = {
    note: Info,
    tip: Lightbulb,
    important: AlertCircle,
    warning: AlertTriangle,
    caution: AlertOctagon,
  };
  const Icon = icons[node.variant] ?? Info;
  return (
    <aside className="itmd-alert" data-variant={node.variant}>
      <div className="alert-icon"><Icon aria-hidden="true" size={16} /></div>
      <div>
        <header>
          <strong>{node.title ?? node.variant.toUpperCase()}</strong>
          {node.inlineTitle?.length ? <span>{renderInline(node.inlineTitle)}</span> : null}
        </header>
        {node.children?.length ? <div className="alert-body">{node.children.map((child, index) => renderBlock(child, index, context, true))}</div> : null}
      </div>
    </aside>
  );
}

function ListBlock({ node, context }: { node: List; context: RenderContext }) {
  const TagName = node.ordered ? "ol" : "ul";
  return (
    <TagName className="markdown-list" start={node.start ?? undefined}>
      {node.children.map((item: ListItem, index) => (
        <li className={typeof item.checked === "boolean" ? "task-item" : undefined} key={index}>
          {typeof item.checked === "boolean" ? <input checked={item.checked} readOnly type="checkbox" /> : null}
          {item.children.map((child, childIndex) => {
            if (child.type === "paragraph") return <span key={childIndex}>{renderInline(child.children)}</span>;
            return renderBlock(child as ItineraryNode, childIndex, context);
          })}
        </li>
      ))}
    </TagName>
  );
}

function TableBlock({ node }: { node: Table }) {
  return (
    <div className="table-scroll">
      <table>
        <tbody>
          {node.children.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.children.map((cell, cellIndex) => {
                const Cell = rowIndex === 0 ? "th" : "td";
                return <Cell key={cellIndex}>{renderInline(cell.children)}</Cell>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlock(node: ItineraryNode, index: number, context: RenderContext, compact = false): ReactNode {
  const key = `${node.type}-${index}`;
  if (node.type === "itmdHeading") return <DateHeading fallbackTimezone={context.timezone} key={key} node={node} />;
  if (node.type === "itmdEvent") return <EventBlock context={context} event={node} key={key} />;
  if (node.type === "itmdAlert") return <AlertBlock context={context} key={key} node={node} />;
  if (node.type === "heading") {
    const heading = node as Heading;
    const TagName = `h${heading.depth}` as keyof React.JSX.IntrinsicElements;
    return <TagName key={key}>{renderInline(heading.children)}</TagName>;
  }
  if (node.type === "paragraph") {
    return <p className={compact ? "compact" : undefined} key={key}>{renderInline((node as Paragraph).children)}</p>;
  }
  if (node.type === "list") return <ListBlock context={context} key={key} node={node as List} />;
  if (node.type === "blockquote") {
    return <blockquote key={key}>{(node as Blockquote).children.map((child, childIndex) => renderBlock(child as ItineraryNode, childIndex, context, true))}</blockquote>;
  }
  if (node.type === "code") {
    const code = node as Code;
    return <pre key={key}><code>{code.value}</code></pre>;
  }
  if (node.type === "thematicBreak") return <hr key={key} />;
  if (node.type === "table") return <TableBlock key={key} node={node as Table} />;
  return null;
}

function parseMoney(value: string | number | undefined, fallbackCurrency: string) {
  if (value === undefined) return undefined;
  const raw = String(value);
  const amountMatch = raw.replaceAll(",", "").match(/[+-]?\d+(?:\.\d+)?/);
  if (!amountMatch) return undefined;
  const currency = raw.match(/\b[A-Za-z]{3}\b/)?.[0]?.toUpperCase() ?? fallbackCurrency;
  const amount = Number(amountMatch[0]);
  return Number.isFinite(amount) ? { amount, currency } : undefined;
}

function Statistics({
  displayCurrency,
  exchangeRates,
  nodes,
  frontmatter,
}: {
  displayCurrency: string;
  exchangeRates?: Record<string, number>;
  nodes: ItineraryNode[];
  frontmatter: ItineraryFrontmatter;
}) {
  const dates = nodes
    .filter((node): node is ItineraryHeadingNode => node.type === "itmdHeading")
    .map((node) => node.dateISO)
    .sort();
  const events = nodes.filter((node): node is ItineraryEventNode => node.type === "itmdEvent");
  const totals = { transportation: 0, activity: 0, stay: 0 };
  for (const event of events) {
    for (const entry of event.data?.itmdPrice ?? []) {
      for (const token of entry.price.tokens ?? []) {
        if (token.kind !== "money") continue;
        const currency = (token.normalized?.currency ?? token.currency)?.toUpperCase();
        const amount = Number(token.normalized?.amount ?? token.amount);
        if (currency && Number.isFinite(amount)) {
          const converted = convertCurrency(
            amount,
            currency,
            displayCurrency,
            exchangeRates,
          );
          if (converted !== undefined) {
            totals[event.baseType ?? "activity"] += converted;
          }
        }
      }
    }
  }
  const total = totals.transportation + totals.activity + totals.stay;
  const sourceBudget = parseMoney(frontmatter.budget, frontmatter.currency);
  const convertedBudget = sourceBudget
    ? convertCurrency(
        sourceBudget.amount,
        sourceBudget.currency,
        displayCurrency,
        exchangeRates,
      )
    : undefined;
  const budget = convertedBudget === undefined
    ? undefined
    : { amount: convertedBudget, currency: displayCurrency };
  const first = dates.at(0);
  const last = dates.at(-1);
  const days = first && last
    ? Math.round((new Date(last).getTime() - new Date(first).getTime()) / 86_400_000) + 1
    : undefined;

  return (
    <section className="statistics" aria-label="Itinerary statistics">
      <div className="money-summary">
        <div className="money-total" data-budget={budget ? (total <= budget.amount ? "under" : "over") : undefined}>
          {total > 0 ? formatCurrency(total, displayCurrency) : "—"}
          {budget ? <small>/ {formatCurrency(budget.amount, budget.currency)}</small> : null}
        </div>
        <div className="money-breakdown">
          <span><Plane size={20} />{totals.transportation ? formatCurrency(totals.transportation, displayCurrency) : "—"}</span>
          <span><FerrisWheel size={20} />{totals.activity ? formatCurrency(totals.activity, displayCurrency) : "—"}</span>
          <span><BedDouble size={20} />{totals.stay ? formatCurrency(totals.stay, displayCurrency) : "—"}</span>
        </div>
      </div>
      <div className="date-summary">
        {first && last ? <><strong>{first}</strong><span>↓ {days} days</span><strong>{last}</strong></> : <strong>—</strong>}
      </div>
    </section>
  );
}

function tagColor(tag: string): CSSProperties {
  const hue = hash(tag.toLowerCase()) % 360;
  return {
    backgroundColor: `hsl(${hue} 60% 85%)`,
    borderColor: `hsl(${hue} 50% 75%)`,
  };
}

export default function ItineraryDocument({
  displayCurrency,
  exchangeRates,
  itinerary,
}: {
  displayCurrency: string;
  exchangeRates?: Record<string, number>;
  itinerary: ParsedItinerary;
}) {
  const { frontmatter, root } = itinerary;
  const context = {
    displayCurrency,
    exchangeRates,
    timezone: frontmatter.timezone,
  };

  return (
    <main className="preview-shell">
      <article className="markdown-preview">
        <h1>{frontmatter.title}</h1>
        {frontmatter.description ? <p className="description">{frontmatter.description}</p> : null}
        {frontmatter.tags.length ? (
          <ul className="tags">
            {frontmatter.tags.map((tag) => <li key={tag} style={tagColor(tag)}>{tag}</li>)}
          </ul>
        ) : null}
        {frontmatter.type === "tripmd" || frontmatter.type === "itmd" || frontmatter.type === "itinerary-md" ? (
          <Statistics
            displayCurrency={displayCurrency}
            exchangeRates={exchangeRates}
            frontmatter={frontmatter}
            nodes={root.children}
          />
        ) : null}
        <div className="document-body">
          {root.children.map((node, index) => renderBlock(node, index, context))}
        </div>
      </article>
    </main>
  );
}
