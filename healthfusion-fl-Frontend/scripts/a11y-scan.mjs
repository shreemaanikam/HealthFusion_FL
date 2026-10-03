#!/usr/bin/env node
/**
 * Structural accessibility scan against the real built HTML -- boots
 * `next start`, fetches each page, runs axe-core inside jsdom, and fails
 * (non-zero exit) on any violation of a rule jsdom can actually evaluate.
 *
 * This is NOT a substitute for real assistive-tech testing or a
 * real-browser run (jsdom doesn't paint, so layout/contrast rules are
 * excluded here -- contrast is covered separately and more reliably by
 * tests/design-tokens.test.ts, which checks the actual color math). What
 * this does catch: missing labels, bad landmark structure, missing
 * alt text, duplicate IDs, invalid ARIA, heading order, and similar
 * DOM-structural issues -- for real, on the pages as actually shipped.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { JSDOM } from "jsdom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const axeSource = readFileSync(path.join(__dirname, "../node_modules/axe-core/axe.min.js"), "utf8");

const PORT = 3211;
const BASE = `http://localhost:${PORT}`;

const PAGES = [
  "/", "/product", "/how-it-works", "/technology", "/security", "/privacy",
  "/research", "/documentation", "/demo", "/for-hospitals", "/request-pilot",
  "/login", "/select-organization",
  "/dashboard", "/assessment", "/assessment/history", "/explainability",
  "/insights", "/models", "/models/comparison", "/federated",
  "/federated/rounds", "/federated/hospitals/hosp-a", "/privacy-center",
  "/audit", "/system", "/settings", "/notifications", "/help",
  "/assessment/result/ax-100234", "/reports/ax-100234",
  "/403", "/404", "/maintenance", "/error",
];

// jsdom can't paint, so exclude rules that need real layout/rendering --
// contrast is verified separately, precisely, against the actual tokens.
const JSDOM_INCOMPATIBLE_RULES = ["color-contrast", "target-size", "scrollable-region-focusable"];

function waitForServer() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      fetch(BASE).then(() => resolve()).catch(() => {
        if (Date.now() - start > 45000) return reject(new Error("server didn't come up"));
        setTimeout(tick, 500);
      });
    };
    tick();
  });
}

async function scanPage(path) {
  const res = await fetch(`${BASE}${path}`);
  const html = await res.text();
  const dom = new JSDOM(html, { url: `${BASE}${path}`, runScripts: "outside-only" });
  dom.window.eval(axeSource);
  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
    rules: Object.fromEntries(JSDOM_INCOMPATIBLE_RULES.map((r) => [r, { enabled: false }])),
  });
  dom.window.close();
  return results.violations;
}

async function main() {
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "pipe" });
  let totalViolations = 0;
  const report = [];

  try {
    await waitForServer();
    for (const path of PAGES) {
      const violations = await scanPage(path);
      if (violations.length > 0) {
        totalViolations += violations.length;
        report.push({ path, violations: violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })) });
      }
    }
  } finally {
    server.kill();
  }

  console.log(`Scanned ${PAGES.length} pages.`);
  if (totalViolations === 0) {
    console.log("No structural accessibility violations found.");
  } else {
    console.log(`${totalViolations} violation(s):\n`);
    for (const r of report) {
      console.log(`  ${r.path}`);
      for (const v of r.violations) console.log(`    [${v.impact}] ${v.id} (${v.nodes} node(s)) -- ${v.help}`);
    }
    process.exitCode = 1;
  }
}

main();
