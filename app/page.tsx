import { getTripPlan, type TripDay } from "@/lib/plan";

const route = [
  "Tokyo",
  "Shanghai",
  "Wuhan",
  "Shenzhen",
  "Hong Kong",
  "Zhuhai",
  "Macau",
  "Ganzhou",
  "Hong Kong",
  "Tokyo",
];

const statusClass: Record<string, string> = {
  Booked: "status-booked",
  Planned: "status-planned",
  Flexible: "status-flexible",
  Confirm: "status-confirm",
  Decide: "status-decide",
  Idea: "status-idea",
};

function cityFromTitle(title: string) {
  return title.split("·").at(-1)?.trim() ?? title;
}

function monthDay(date: string) {
  if (!date) return { month: "", day: "" };
  const parsed = new Date(`${date}T12:00:00Z`);
  return {
    month: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(parsed),
    day: new Intl.DateTimeFormat("en", { day: "2-digit", timeZone: "UTC" }).format(parsed),
  };
}

function DayCard({ day, index }: { day: TripDay; index: number }) {
  const date = monthDay(day.date);
  const weekday = day.title.split(" ")[0];

  return (
    <article className="day-card" id={`day-${day.date || index}`}>
      <header className="day-header">
        <div className="date-tile" aria-label={`${date.month} ${date.day}`}>
          <span>{date.month}</span>
          <strong>{date.day}</strong>
        </div>
        <div>
          <p className="eyebrow">Day {index + 1} · {weekday}</p>
          <h3>{cityFromTitle(day.title)}</h3>
          <p className="timezone">{day.timezone}</p>
        </div>
      </header>

      <div className="events">
        {day.events.map((event, eventIndex) => (
          <div className="event" key={`${day.date}-${eventIndex}`}>
            <div className="event-time">{event.time}</div>
            <div className="event-copy">
              <div className="event-title-row">
                <h4>{event.plan}</h4>
                <span className={`status ${statusClass[event.status] ?? "status-flexible"}`}>
                  {event.status}
                </span>
              </div>
              {event.details && event.details !== "—" ? <p>{event.details}</p> : null}
            </div>
          </div>
        ))}
      </div>

      {day.note ? <div className="branch-note"><strong>Route branch</strong>{day.note}</div> : null}
    </article>
  );
}

export default function Home() {
  const plan = getTripPlan();
  const openItems = plan.days.flatMap((day) =>
    day.events.filter((event) => ["Confirm", "Decide"].includes(event.status)),
  );

  return (
    <main>
      <section className="hero">
        <nav className="topbar" aria-label="Page sections">
          <a className="brand" href="#top">CN<span>26</span></a>
          <div className="nav-links">
            <a href="#itinerary">Itinerary</a>
            <a href="#decisions">To decide</a>
            <a href="#ideas">Ideas</a>
          </div>
        </nav>

        <div className="hero-copy" id="top">
          <p className="kicker">A living itinerary · 15 calendar days</p>
          <h1>Going where the<br /><em>friends are.</em></h1>
          <p className="lede">Tokyo to Shanghai, down through Wuhan and the Pearl River Delta, then home from Hong Kong.</p>
          <div className="trip-meta">
            <div><span>Dates</span><strong>28 Aug–12 Sep</strong></div>
            <div><span>Budget</span><strong>{plan.budget}</strong></div>
            <div><span>Updated</span><strong>{plan.updated}</strong></div>
          </div>
        </div>

        <div className="route-board" aria-label="Trip route">
          {route.map((place, index) => (
            <div className="route-stop" key={`${place}-${index}`}>
              <span className="route-dot" />
              <span>{place}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-shell intro-grid">
        <div>
          <p className="section-label">The plan at a glance</p>
          <h2>Clear about what’s real.<br />Flexible where it matters.</h2>
        </div>
        <p className="section-intro">Booked travel stays distinct from ideas and open decisions. All times are local to the location shown, and the Markdown file remains the editable source.</p>
      </section>

      <section className="content-shell" id="decisions">
        <div className="decision-panel">
          <div className="decision-heading">
            <span>{String(openItems.length).padStart(2, "0")}</span>
            <div><p className="section-label">Before departure</p><h2>Things to lock in</h2></div>
          </div>
          <div className="decision-list">
            {plan.checklist.slice(0, 8).map((item, index) => (
              <div className="check-item" key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <details>
            <summary>Show the remaining checklist</summary>
            <div className="remaining-list">
              {plan.checklist.slice(8).map((item) => <p key={item}>{item}</p>)}
            </div>
          </details>
        </div>
      </section>

      <section className="itinerary-section" id="itinerary">
        <div className="content-shell itinerary-heading">
          <p className="section-label">Day by day</p>
          <h2>The itinerary</h2>
          <div className="legend" aria-label="Status legend">
            <span><i className="legend-booked" />Booked</span>
            <span><i className="legend-planned" />Planned</span>
            <span><i className="legend-open" />Open</span>
          </div>
        </div>
        <div className="content-shell timeline">
          {plan.days.map((day, index) => <DayCard day={day} index={index} key={day.date} />)}
        </div>
      </section>

      <section className="ideas-section" id="ideas">
        <div className="content-shell">
          <p className="section-label light">Optional, not scheduled</p>
          <h2>Ideas worth kicking around</h2>
          <div className="idea-grid">
            {plan.ideas.map((group, index) => (
              <article className="idea-card" key={group.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{group.title}</h3>
                <ul>{group.ideas.map((idea) => <li key={idea}>{idea}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-shell practical-section">
        <div>
          <p className="section-label">Small notes, big difference</p>
          <h2>Practical</h2>
        </div>
        <div className="practical-grid">
          {plan.practicalNotes.map((note, index) => (
            <div className="practical-note" key={note}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{note}</p>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <p>China trip · 2026</p>
        <p>Update the plan, publish the next version, keep the same link.</p>
      </footer>
    </main>
  );
}
