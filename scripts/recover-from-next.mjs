import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const nextDir = path.join(root, ".next");
const files = new Map();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".map")) {
      try {
        const map = JSON.parse(fs.readFileSync(full, "utf8"));
        if (!map.sources || !map.sourcesContent) continue;
        map.sources.forEach((src, i) => {
          const content = map.sourcesContent[i];
          if (!content || !src) return;
          const norm = src.replace(/\\/g, "/");
          if (norm.includes("node_modules/")) return;
          const markers = ["/app/", "/components/", "/lib/", "/types/"];
          const hasMarker = markers.some((m) => norm.includes(m));
          const isMiddleware =
            norm.endsWith("/middleware.ts") || norm.endsWith("middleware.ts");
          if (!hasMarker && !isMiddleware) return;

          let rel;
          if (isMiddleware && !norm.includes("/lib/")) {
            rel = "middleware.ts";
          } else {
            const start = Math.min(
              ...markers.map((m) => norm.indexOf(m)).filter((x) => x >= 0)
            );
            rel = norm.slice(start + 1);
          }

          rel = decodeURIComponent(rel);
          if (
            rel.includes("__nextjs-internal") ||
            rel.includes("route-entry") ||
            rel.includes("structured image")
          ) {
            return;
          }

          const existing = files.get(rel);
          if (!existing || content.length > existing.length) {
            files.set(rel, content);
          }
        });
      } catch {
        // skip invalid maps
      }
    }
  }
}

walk(nextDir);

let written = 0;
for (const [rel, content] of files) {
  const out = path.join(root, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content.replace(/\r\n/g, "\n"));
  written++;
}

console.log(`Restored ${written} files from .next source maps.`);
