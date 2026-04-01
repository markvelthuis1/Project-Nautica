/* global Buffer, process */

import { createServer as createHttpServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

import { createDefaultTrackerState } from "./src/trackerDefaults.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const trackerFilePath = path.join(dataDir, "tracker.json");
const distDir = path.join(__dirname, "dist");
const isDev = process.argv.includes("--dev") || !existsSync(path.join(distDir, "index.html"));
const port = Number(process.env.PORT) || 3000;

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
};

const normalizeTrackerState = (value) => {
  const fallback = createDefaultTrackerState();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  return {
    data: value.data && typeof value.data === "object" ? value.data : fallback.data,
    expanded: value.expanded && typeof value.expanded === "object" ? value.expanded : fallback.expanded,
  };
};

const ensureTrackerFile = async () => {
  await mkdir(dataDir, { recursive: true });

  if (!existsSync(trackerFilePath)) {
    await writeFile(trackerFilePath, JSON.stringify(createDefaultTrackerState(), null, 2));
  }
};

const readTrackerState = async () => {
  await ensureTrackerFile();

  try {
    const raw = await readFile(trackerFilePath, "utf8");
    return normalizeTrackerState(JSON.parse(raw));
  } catch {
    const fallback = createDefaultTrackerState();
    await writeFile(trackerFilePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
};

const writeTrackerState = async (state) => {
  const normalized = normalizeTrackerState(state);
  await ensureTrackerFile();
  await writeFile(trackerFilePath, JSON.stringify(normalized, null, 2));
  return normalized;
};

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".ico") return "image/x-icon";

  return "text/html; charset=utf-8";
};

const serveStaticFile = async (res, filePath) => {
  const stream = createReadStream(filePath);

  return new Promise((resolve, reject) => {
    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    stream.pipe(res);
    stream.on("end", resolve);
    stream.on("error", reject);
  });
};

const vite = isDev
  ? await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    })
  : null;

const server = createHttpServer(async (req, res) => {
  const url = req.url ? new URL(req.url, `http://${req.headers.host}`) : null;

  if (!url) {
    sendJson(res, 400, { error: "Invalid request URL." });
    return;
  }

  if (url.pathname === "/api/tracker") {
    try {
      if (req.method === "GET") {
        sendJson(res, 200, await readTrackerState());
        return;
      }

      if (req.method === "PUT") {
        const body = await readRequestBody(req);
        const nextState = body ? JSON.parse(body) : {};
        sendJson(res, 200, await writeTrackerState(nextState));
        return;
      }

      res.writeHead(405, { Allow: "GET, PUT" });
      res.end();
      return;
    } catch (error) {
      sendJson(res, 500, {
        error: "Kon trackerbestand niet verwerken.",
        details: error instanceof Error ? error.message : String(error),
      });
      return;
    }
  }

  if (isDev && vite) {
    vite.middlewares(req, res, () => {
      res.statusCode = 404;
      res.end("Not found");
    });
    return;
  }

  try {
    const requestedPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const filePath = path.join(distDir, requestedPath);
    const safePath = filePath.startsWith(distDir) ? filePath : path.join(distDir, "index.html");

    if (existsSync(safePath) && !safePath.endsWith(path.sep)) {
      await serveStaticFile(res, safePath);
      return;
    }

    await serveStaticFile(res, path.join(distDir, "index.html"));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(port, async () => {
  await ensureTrackerFile();
  const mode = isDev ? "development" : "production";
  console.log(`Project Nautica server running on http://localhost:${port} (${mode})`);
});
