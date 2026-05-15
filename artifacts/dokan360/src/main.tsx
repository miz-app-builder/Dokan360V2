import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/config";
import { setBaseUrl } from "@workspace/api-client-react";
import { errorReporter } from "./lib/error-reporter";

// ─── Production API URL ───────────────────────────────────────────────────────
// VITE_API_URL is injected at build time via vite.config.ts `define`.
// In development: empty string → uses Vite's /api proxy → localhost:8080
// In production: set VITE_API_URL env var to the deployed API base URL
//   e.g. https://your-api.replit.app  (no trailing slash)
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

// ─── Error reporter init (TASK 8) ─────────────────────────────────────────────
// Activates Sentry when VITE_SENTRY_DSN is set; otherwise logs only.
errorReporter.init();

createRoot(document.getElementById("root")!).render(<App />);
