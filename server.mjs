import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, extname, join } from "node:path";
import { createServer } from "node:http";

const root = resolve("dist");
const port = 3000;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = decoded === "/" ? "/index.html" : decoded;
  const candidate = resolve(join(root, normalized));
  return candidate.startsWith(root) ? candidate : resolve(root, "index.html");
}

createServer((request, response) => {
  const filePath = safePath(request.url || "/");
  const target = existsSync(filePath) && statSync(filePath).isFile() ? filePath : resolve(root, "index.html");
  response.writeHead(200, {
    "Content-Type": types[extname(target)] || "application/octet-stream",
    "Cache-Control": target.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
  });
  createReadStream(target).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`SubSync static preview listening on http://127.0.0.1:${port}`);
});
