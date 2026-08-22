import type { TripDay, TripPlan } from "@/lib/plan";

const statusOrder = ["Booked", "Planned", "Flexible", "Confirm", "Decide", "Idea"];

function statusKey(status: string) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function parseDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function tripDateRange(days: TripDay[]) {
  const first = days.at(0)?.date;
  const last = days.at(-1)?.date;
  if (!first || !last) return "Dates to decide";

  const start = parseDate(first);
  const end = parseDate(last);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const startText = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  }).format(start);
  const endText = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(end);

  return `${startText} → ${endText}`;
}

function tripLength(days: TripDay[]) {
  const first = days.at(0)?.date;
  const last = days.at(-1)?.date;
  if (!first || !last) return days.length;
  return Math.round((parseDate(last).getTime() - parseDate(first).getTime()) / 86_400_000) + 1;
}

function StatusTag({ status }: { status: string }) {
  return (
    <span className="tag status-tag" data-status={statusKey(status)}>
      {status.toLowerCase()}
    </span>
  );
}

function TimeCell({ value }: { value: string }) {
  const [start, end] = value.split("–", 2).map((part) => part.trim());

  if (!end) return <span className="time-single">{value}</span>;

  return (
    <span className="time-range" aria-label={`${start} to ${end}`}>
      <span>{start}</span>
      <span className="time-arrow" aria-hidden="true">↓</span>
      <span>{end}</span>
    </span>
  );
}

function DaySection({ day }: { day: TripDay }) {
  return (
    <section className="day" id={"day-" + day.date}>
      <h3>{day.title}</h3>
      <p className="day-meta">
        <code>{day.date}</code> · {day.timezone}
      </p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Plan</th>
              <th>Details</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {day.events.map((event, index) => (
              <tr key={day.date + "-" + index}>
                <td><TimeCell value={event.time} /></td>
                <td>{event.plan}</td>
                <td className={event.details === "—" ? "empty" : undefined}>{event.details}</td>
                <td><StatusTag status={event.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {day.note ? <blockquote><strong>Branch:</strong> {day.note}</blockquote> : null}
    </section>
  );
}

export default function TripDocument({
  plan,
  breadcrumb = "Template preview",
  sourceLabel = "sample-travel-plan.md",
}: {
  plan: TripPlan;
  breadcrumb?: string;
  sourceLabel?: string;
}) {
  const allEvents = plan.days.flatMap((day) => day.events);
  const statusCounts = Object.fromEntries(
    statusOrder.map((status) => [
      status,
      allEvents.filter((event) => event.status === status).length,
    ]),
  );
  const openCount = (statusCounts.Confirm ?? 0) + (statusCounts.Decide ?? 0);
  const dateRange = tripDateRange(plan.days);
  const calendarDays = tripLength(plan.days);

  return (
    <main className="markdown">
      <article>
        <header id="top">
          <div className="page-icon" aria-hidden="true">🗺️</div>
          <p className="breadcrumb">{breadcrumb}</p>
          <h1>{plan.title}</h1>
          <p className="lead">{plan.description}</p>
          <dl className="properties" aria-label="Trip properties">
            <div><dt>Dates</dt><dd>{dateRange}</dd></div>
            <div><dt>Budget</dt><dd>{plan.budget}</dd></div>
            <div><dt>Length</dt><dd><span className="tag">{calendarDays} calendar days</span></dd></div>
            <div><dt>Planning</dt><dd><span className="tag tag-open">{openCount} open decisions</span></dd></div>
            <div><dt>Updated</dt><dd>{plan.updated}</dd></div>
          </dl>
        </header>

        <nav className="toc" aria-label="Contents">
          <strong>On this page</strong>
          <a href="#overview">Overview</a>
          <a href="#before-you-go">Before you go</a>
          <a href="#itinerary">Itinerary</a>
          <a href="#ideas">Ideas</a>
          <a href="#practical">Practical notes</a>
        </nav>

        <section id="overview">
          <h2>Overview</h2>

          <figure className="route-graph">
            <figcaption>Route</figcaption>
            <div className="route-flow">
              {plan.route.map((place, index) => (
                <span className="route-step" key={place + "-" + index}>
                  <span className="route-node">{place}</span>
                  {index < plan.route.length - 1 ? <span className="route-arrow" aria-hidden="true">→</span> : null}
                </span>
              ))}
            </div>
          </figure>

          <figure className="status-graph">
            <figcaption>Schedule status · {allEvents.length} items</figcaption>
            <div className="status-bar" aria-hidden="true">
              {statusOrder.map((status) => (
                <span
                  data-status={statusKey(status)}
                  key={status}
                  style={{ flexGrow: statusCounts[status] }}
                />
              ))}
            </div>
            <div className="status-key">
              {statusOrder.map((status) => (
                <span key={status}>
                  <i data-status={statusKey(status)} />
                  {status} {statusCounts[status]}
                </span>
              ))}
            </div>
          </figure>
        </section>

        <section id="before-you-go">
          <h2>Before you go</h2>
          <ul className="task-list">
            {plan.checklist.map((item) => (
              <li key={item}>
                <span className="checkbox" aria-hidden="true">□</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="itinerary">
          <h2>Itinerary</h2>
          {plan.days.map((day) => <DaySection day={day} key={day.date} />)}
        </section>

        <section id="ideas">
          <h2>Ideas to discuss</h2>
          {plan.ideas.map((group) => (
            <section className="idea-group" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.ideas.map((idea) => <li key={idea}>{idea}</li>)}
              </ul>
            </section>
          ))}
        </section>

        <section id="practical">
          <h2>Practical notes</h2>
          <ul>
            {plan.practicalNotes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </section>

        <footer>
          <a href="#top">↑ back to top</a>
          <span>Source: <code>{sourceLabel}</code></span>
        </footer>
      </article>
    </main>
  );
}
