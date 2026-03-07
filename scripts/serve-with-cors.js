#!/usr/bin/env node
/**
 * Serves the dist folder with CORS headers so the bundle can be
 * loaded from Webflow (little-bee-speech.webflow.io) or other origins.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const ROOT = path.join(__dirname, "..", "dist");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "ngrok-skip-browser-warning",
  "Access-Control-Max-Age": "86400",
};

const MIME = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const safePath = req.url === "/" ? "index.html" : path.normalize(req.url).replace(/^(\.\.(\/|\\|$))+/, "").replace(/^\/+/, "");
  const filePath = path.join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { ...CORS_HEADERS, "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }
  const ext = path.extname(filePath);
  const mime = MIME[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { ...CORS_HEADERS, "Content-Type": "text/plain" });
        res.end("Not Found");
      } else {
        res.writeHead(500, { ...CORS_HEADERS, "Content-Type": "text/plain" });
        res.end("Server Error");
      }
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime,
      ...CORS_HEADERS,
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Serving dist with CORS at http://localhost:${PORT}`);
});
