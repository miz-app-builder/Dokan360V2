import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 5000);

const httpServer = createHttpServer();

const vite = await createViteServer({
  configFile: path.resolve(__dirname, "vite.config.ts"),
  server: {
    middlewareMode: true,
    hmr: { server: httpServer },
    host: "0.0.0.0",
    allowedHosts: true,
  },
  appType: "spa",
});

httpServer.on("request", vite.middlewares);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  VITE ready\n  ➜  Local:   http://localhost:${PORT}/\n  ➜  Network: http://0.0.0.0:${PORT}/\n`);
});

process.on("SIGTERM", async () => {
  await vite.close();
  process.exit(0);
});
