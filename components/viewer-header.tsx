import { Info } from "lucide-react";
import { SiGithub } from "react-icons/si";

export const VIEWER_REPOSITORY = "https://github.com/yuitof/plaintrip-md";

export default function ViewerHeader() {
  return (
    <header className="viewer-header">
      <a className="viewer-brand" href="/" aria-label="PlainTrip MD home">
        <strong>PlainTrip</strong>
        <span>MD</span>
      </a>
      <nav aria-label="Project links">
        <a
          href={VIEWER_REPOSITORY}
          rel="noreferrer"
          target="_blank"
          title="PlainTrip MD on GitHub"
        >
          <SiGithub aria-hidden="true" size={18} />
          <span className="sr-only">PlainTrip MD on GitHub</span>
        </a>
        <a
          href={`${VIEWER_REPOSITORY}#readme`}
          rel="noreferrer"
          target="_blank"
          title="About PlainTrip MD"
        >
          <Info aria-hidden="true" size={18} />
          <span className="sr-only">About PlainTrip MD</span>
        </a>
      </nav>
    </header>
  );
}
