import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const transcript =
  "C:/Users/aruna/.cursor/projects/c-Users-aruna-OneDrive-Desktop-Taskora/agent-transcripts/29cb60e8-55e1-4f26-a9f7-e1aa4a296105/29cb60e8-55e1-4f26-a9f7-e1aa4a296105.jsonl";

const wanted = new Set([
  "types/database.ts",
  "package.json",
  "app/globals.css",
  "README.md",
  "supabase/migrations/001_initial_schema.sql",
  "supabase/migrations/002_search_indexes.sql",
  "supabase/migrations/003_team_lead_tasks.sql",
]);

const files = new Map();

for (const line of fs.readFileSync(transcript, "utf8").split("\n")) {
  if (!line.trim()) continue;
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    continue;
  }
  const parts = obj.message?.content;
  if (!Array.isArray(parts)) continue;
  for (const part of parts) {
    if (
      part.type !== "tool_use" ||
      part.name !== "Write" ||
      !part.input?.path ||
      !part.input?.contents
    ) {
      continue;
    }
    const rel = part.input.path.replace(/\\/g, "/").split("/Taskora/")[1];
    if (!rel || !wanted.has(rel)) continue;
    const existing = files.get(rel);
    if (!existing || part.input.contents.length >= existing.length) {
      files.set(rel, part.input.contents);
    }
  }
}

for (const [rel, content] of files) {
  const out = path.join(root, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content.replace(/\r\n/g, "\n"));
  console.log("Wrote", rel);
}

console.log(
  "Missing:",
  [...wanted].filter((x) => !files.has(x)).join(", ") || "none"
);
