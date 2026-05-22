import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const rootDir = path.resolve(new URL("..", import.meta.url).pathname);
const sourceRoots = ["script.js", "src"];
const importPattern = /(?:import|export)\s+(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function walk(entry) {
  const absolute = path.join(rootDir, entry);
  const stat = statSync(absolute);
  if (stat.isFile()) return absolute.endsWith(".js") ? [absolute] : [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((item) => {
    if (item.name === "node_modules") return [];
    const child = path.join(entry, item.name);
    return item.isDirectory() ? walk(child) : walk(child);
  });
}

function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function stripQuery(specifier) {
  return specifier.split("?")[0];
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  const cleaned = stripQuery(specifier);
  const resolved = path.resolve(path.dirname(fromFile), cleaned);
  const withExtension = path.extname(resolved) ? resolved : `${resolved}.js`;
  return toProjectPath(withExtension);
}

function getLayer(filePath) {
  if (filePath === "script.js") return "entry";
  if (filePath.startsWith("src/domain/")) return "domain";
  if (filePath.startsWith("src/application/")) return "application";
  if (filePath.startsWith("src/infrastructure/")) return "infrastructure";
  if (filePath.startsWith("src/presentation/")) return "presentation";
  if (filePath.startsWith("src/shared/")) return "shared";
  return "other";
}

const allowedLayers = {
  entry: new Set(["application", "presentation", "shared"]),
  presentation: new Set(["presentation", "application", "domain", "shared"]),
  application: new Set(["application", "domain", "infrastructure", "shared"]),
  infrastructure: new Set(["infrastructure", "shared"]),
  domain: new Set(["domain", "shared"]),
  shared: new Set(["shared"]),
  other: new Set(["entry", "presentation", "application", "domain", "infrastructure", "shared", "other"])
};

function getConstraintViolation(from, to) {
  const fromLayer = getLayer(from);
  const toLayer = getLayer(to);
  if (!allowedLayers[fromLayer]?.has(toLayer)) {
    return `${fromLayer} must not import ${toLayer}`;
  }
  if (from.startsWith("src/application/controllers/") && to.startsWith("src/application/controllers/")) {
    return "application controllers must not import sibling controllers";
  }
  if (from.startsWith("src/presentation/ui/") && !to.startsWith("src/presentation/ui/") && toLayer !== "shared") {
    return "presentation/ui must stay browser-adapter only";
  }
  if (from.startsWith("src/presentation/components/") && ["application", "infrastructure"].includes(toLayer)) {
    return "presentation/components must not import application or infrastructure";
  }
  if (from.startsWith("src/presentation/") && to.startsWith("src/application/state/")) {
    return "presentation must consume application state through controllers or view models";
  }
  if (from.startsWith("src/presentation/") && to.startsWith("src/infrastructure/")) {
    return "presentation must not import infrastructure";
  }
  return "";
}

function findCycles(graph) {
  const cycles = [];
  const stack = [];
  const state = new Map();

  function visit(node) {
    state.set(node, "visiting");
    stack.push(node);

    for (const next of graph.get(node) || []) {
      if (!graph.has(next)) continue;
      if (state.get(next) === "visiting") {
        cycles.push([...stack.slice(stack.indexOf(next)), next]);
      } else if (!state.has(next)) {
        visit(next);
      }
    }

    stack.pop();
    state.set(node, "visited");
  }

  for (const node of graph.keys()) {
    if (!state.has(node)) visit(node);
  }

  return cycles;
}

const files = sourceRoots.flatMap(walk).sort();
const graph = new Map();
const lineCounts = new Map();
const violations = [];

for (const file of files) {
  const projectPath = toProjectPath(file);
  const source = readFileSync(file, "utf8");
  lineCounts.set(projectPath, source.split("\n").length);
  const imports = [];
  let match;

  while ((match = importPattern.exec(source))) {
    const target = resolveImport(file, match[1] || match[2]);
    if (!target) continue;
    imports.push(target);
    const reason = getConstraintViolation(projectPath, target);
    if (reason) violations.push({ from: projectPath, to: target, reason });
  }

  graph.set(projectPath, imports);
}

const incoming = new Map(files.map((file) => [toProjectPath(file), 0]));
for (const imports of graph.values()) {
  imports.forEach((target) => incoming.set(target, (incoming.get(target) || 0) + 1));
}

const topFiles = [...lineCounts.entries()]
  .sort((left, right) => right[1] - left[1])
  .slice(0, 8);
const topFanOut = [...graph.entries()]
  .map(([file, imports]) => [file, imports.length])
  .sort((left, right) => right[1] - left[1])
  .slice(0, 8);
const topFanIn = [...incoming.entries()]
  .sort((left, right) => right[1] - left[1])
  .slice(0, 8);
const cycles = findCycles(graph);

function printSection(title, rows, format) {
  console.log(`\n${title}`);
  if (!rows.length) {
    console.log("  none");
    return;
  }
  rows.forEach((row) => console.log(`  ${format(row)}`));
}

console.log("Coupling analysis");
console.log(`  files: ${files.length}`);
console.log(`  imports: ${[...graph.values()].reduce((total, imports) => total + imports.length, 0)}`);
console.log(`  layer violations: ${violations.length}`);
console.log(`  cycles: ${cycles.length}`);

printSection("Largest files", topFiles, ([file, lines]) => `${lines.toString().padStart(4)}  ${file}`);
printSection("Highest fan-out", topFanOut, ([file, count]) => `${count.toString().padStart(4)}  ${file}`);
printSection("Highest fan-in", topFanIn, ([file, count]) => `${count.toString().padStart(4)}  ${file}`);
printSection(
  "Layer violations",
  violations,
  ({ from, to, reason }) => `${from} -> ${to} (${reason})`
);
printSection("Cycles", cycles, (cycle) => cycle.join(" -> "));

if (violations.length || cycles.length) {
  process.exitCode = 1;
}
