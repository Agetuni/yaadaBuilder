import { installProxy } from "./lib/proxy";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { PublishedViewer } from "./components/PublishedViewer.tsx";
import "./index.css";

// Install proxy before any API calls can happen
installProxy();

function getPublishSlug(): string | null {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  let path = window.location.pathname;
  if (base && base !== "/" && path.startsWith(base)) {
    path = path.slice(base.length) || "/";
  }
  const match = path.match(/^\/p\/([^/]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

const publishSlug = getPublishSlug();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {publishSlug ? <PublishedViewer slug={publishSlug} /> : <App />}
  </StrictMode>,
);
