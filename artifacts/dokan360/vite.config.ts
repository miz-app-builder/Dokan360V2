import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

// ─── Production API URL ───────────────────────────────────────────────────────
// In production (deployed), set VITE_API_URL to the absolute API base URL.
// When not set, the frontend uses relative `/api` paths via Vite proxy.
const apiUrl = process.env.VITE_API_URL ?? "";

// ─── Public site URL (for SEO / OG tags) ─────────────────────────────────────
// Set VITE_PUBLIC_URL to the canonical production URL (e.g. https://dokan360.replit.app).
// Falls back to REPLIT_DEV_DOMAIN in development, empty string otherwise.
const publicUrl = process.env.VITE_PUBLIC_URL
  ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "");

export default defineConfig({
  base: basePath,
  define: {
    "import.meta.env.VITE_SUPABASE_URL":      JSON.stringify(process.env.SUPABASE_URL      ?? ""),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(process.env.SUPABASE_ANON_KEY ?? ""),
    "import.meta.env.VITE_API_URL":           JSON.stringify(apiUrl),
    "import.meta.env.VITE_PUBLIC_URL":        JSON.stringify(publicUrl),
  },
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),

    // ─── SEO: inject __PUBLIC_URL__ into index.html ───────────────────────────
    // Replaces __PUBLIC_URL__ tokens in index.html so og:image, canonical, and
    // sitemap can use the absolute production URL at build/dev time.
    {
      name: "html-public-url",
      transformIndexHtml(html: string) {
        return html.replace(/__PUBLIC_URL__/g, publicUrl);
      },
    },

    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),

  // ─── Build optimization ───────────────────────────────────────────────────
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,

    // Target modern browsers — smaller output, no legacy transforms
    target: "es2020",

    // Split CSS per chunk — only load styles needed for the current page
    cssCodeSplit: true,

    // Skip reporting compressed sizes — speeds up build output
    reportCompressedSize: false,

    // Raise the warning threshold; recharts + radix legitimately exceed 500 kB
    chunkSizeWarningLimit: 1500,

    rollupOptions: {
      output: {
        // ── Manual vendor chunks ──────────────────────────────────────────────
        // Splits third-party code into stable, separately-cacheable files.
        // Users returning to the app only re-download chunks that actually changed.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;

          // Chart libraries (recharts pulls in many d3-* sub-packages)
          if (id.includes("recharts") || id.includes("/d3-")) return "chunk-charts";

          // Animation library
          if (id.includes("framer-motion")) return "chunk-motion";

          // Supabase client (auth + realtime)
          if (id.includes("@supabase")) return "chunk-supabase";

          // React Query
          if (id.includes("@tanstack")) return "chunk-query";

          // React core (react + react-dom kept together — always needed)
          if (id.includes("react-dom") || id.includes("/react/")) return "chunk-react";

          // Radix UI primitives
          if (id.includes("@radix-ui")) return "chunk-radix";

          // Excel export (xlsx is large — only needed on Reports page)
          if (id.includes("xlsx")) return "chunk-xlsx";

          // Internationalisation
          if (id.includes("i18next")) return "chunk-i18n";

          // Icon set
          if (id.includes("lucide-react")) return "chunk-icons";

          // Everything else (zod, wouter, clsx, tailwind-merge, etc.)
          return "chunk-vendor";
        },

        // ── Organised output paths ────────────────────────────────────────────
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? "";
          if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(name)) return "assets/img/[name]-[hash][extname]";
          if (/\.css$/i.test(name))                            return "assets/css/[name]-[hash][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },

  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: false,
      allow: [path.resolve(import.meta.dirname, "..", "..")],
    },
    headers: {
      "Cache-Control": "no-store",
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
