import { ArrowLeft, BookOpen, ChevronRight, FileQuestion } from "lucide-react";
import ViewerHeader, { VIEWER_REPOSITORY } from "@/components/viewer-header";

export default function NotFound() {
  return (
    <main className="viewer-app not-found-app">
      <ViewerHeader />

      <section className="preview-panel not-found-panel" aria-labelledby="not-found-heading">
        <header className="preview-panel-header">Preview</header>
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
            <a className="not-found-primary" href="/">
              <ArrowLeft aria-hidden="true" size={15} />
              View the template
            </a>
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
      </section>
    </main>
  );
}
