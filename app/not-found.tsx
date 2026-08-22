export default function NotFound() {
  return (
    <main className="message-page">
      <div className="page-icon" aria-hidden="true">🗺️</div>
      <h1>Itinerary not found</h1>
      <p>
        Check the GitHub owner, repository, page path, and the repository’s
        <code> travel-plan.yml</code> access rules.
      </p>
      <a href="/">View the template itinerary</a>
    </main>
  );
}
