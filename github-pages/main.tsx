import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import StaticViewerApp from "./static-viewer-app";
import "../app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("PlainTrip MD could not find its page root.");

createRoot(root).render(
  <StrictMode>
    <StaticViewerApp />
  </StrictMode>,
);
