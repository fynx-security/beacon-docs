#!/usr/bin/env node
/**
 * Build a static HTML docs site from Mintlify MDX sources.
 * Used for GitHub Pages — does not require Mintlify Enterprise export.
 */
import { mkdir, readFile, readdir, writeFile, cp, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { marked } = require("marked");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "_site");

const BASE = (process.env.DOCS_BASE_PATH || "/beacon-docs").replace(/\/$/, "") || "";

function href(path) {
  const clean = path.replace(/^\//, "").replace(/\.html$/, "");
  if (!clean || clean === "index") return `${BASE}/` || "/";
  return `${BASE}/${clean}/`;
}

function pageToOutPath(page) {
  if (page === "introduction") return join(OUT, "index.html");
  return join(OUT, page, "index.html");
}

function stripFrontmatter(src) {
  if (!src.startsWith("---")) return { meta: {}, body: src };
  const end = src.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: src };
  const fm = src.slice(3, end).trim();
  const body = src.slice(end + 4).replace(/^\n/, "");
  const meta = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return { meta, body };
}

function mdxToMarkdown(body) {
  return body
    .replace(/<CardGroup[^>]*>/g, "\n")
    .replace(/<\/CardGroup>/g, "\n")
    .replace(/<Card\s+title="([^"]*)"[^>]*href="([^"]*)"[^>]*>\s*([\s\S]*?)\s*<\/Card>/g, (_, title, h, desc) => {
      return `\n### [${title}](${h})\n\n${desc.trim()}\n`;
    })
    .replace(/<Card\s+title="([^"]*)"[^>]*>\s*([\s\S]*?)\s*<\/Card>/g, (_, title, desc) => {
      return `\n### ${title}\n\n${desc.trim()}\n`;
    })
    .replace(/<Tabs[^>]*>/g, "\n")
    .replace(/<\/Tabs>/g, "\n")
    .replace(/<Tab\s+title="([^"]*)">/g, (_, t) => `\n#### ${t}\n\n`)
    .replace(/<\/Tab>/g, "\n")
    .replace(/<Steps>/g, "\n")
    .replace(/<\/Steps>/g, "\n")
    .replace(/<Step>/g, "\n1. ")
    .replace(/<\/Step>/g, "\n")
    .replace(/<Warning>\s*([\s\S]*?)\s*<\/Warning>/g, (_, t) => `\n> **Warning:** ${t.trim()}\n`)
    .replace(/<Info>\s*([\s\S]*?)\s*<\/Info>/g, (_, t) => `\n> **Note:** ${t.trim()}\n`)
    .replace(/<Tip>\s*([\s\S]*?)\s*<\/Tip>/g, (_, t) => `\n> **Tip:** ${t.trim()}\n`)
    .replace(/<Note>\s*([\s\S]*?)\s*<\/Note>/g, (_, t) => `\n> **Note:** ${t.trim()}\n`)
    .replace(/<Check>\s*([\s\S]*?)\s*<\/Check>/g, (_, t) => `\n> ✓ ${t.trim()}\n`)
    .replace(/<Frame[^>]*>[\s\S]*?<\/Frame>/g, "\n")
    .replace(/<AccordionGroup>[\s\S]*?<\/AccordionGroup>/g, "\n")
    .replace(/<[A-Za-z][^>]*\/>/g, "")
    .replace(/<\/?[A-Za-z][^>]*>/g, "");
}

function rewriteInternalLinks(html) {
  return html.replace(/href="\/([^"#]+)(#[^"]*)?"/g, (_, path, hash = "") => {
    return `href="${href(path)}${hash}"`;
  });
}

function layout({ title, description, navHtml, content, active }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · Beacon Docs</title>
  <meta name="description" content="${escapeHtml(description || "")}" />
  <link rel="icon" href="${BASE}/favicon.svg" />
  <style>
    :root {
      --bg: #020715;
      --fg: #edf2ff;
      --muted: #8b9bb4;
      --primary: #0092f9;
      --cyber: #22d3ee;
      --card: #121a2e;
      --border: #2a3550;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgb(0 146 249 / 0.18), transparent 70%),
        linear-gradient(rgb(0 146 249 / 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgb(0 146 249 / 0.03) 1px, transparent 1px);
      background-size: 100% 100%, 48px 48px, 48px 48px;
    }
    a { color: var(--cyber); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .shell { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
    @media (max-width: 900px) { .shell { grid-template-columns: 1fr; } .sidebar { position: relative !important; height: auto !important; border-right: none; border-bottom: 1px solid var(--border); } }
    .sidebar {
      position: sticky; top: 0; height: 100vh; overflow: auto;
      border-right: 1px solid var(--border);
      background: rgb(2 7 21 / 0.9);
      padding: 1.25rem;
    }
    .brand { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
    .brand-mark {
      width: 2rem; height: 2rem; border-radius: 0.5rem;
      background: linear-gradient(135deg, var(--primary), var(--cyber));
      display: grid; place-items: center; font-weight: 700; color: white;
    }
    .brand strong { display: block; }
    .brand span { font-size: 0.7rem; color: var(--primary); letter-spacing: 0.08em; text-transform: uppercase; }
    .group { margin-bottom: 1.25rem; }
    .group h2 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin: 0 0 0.5rem; }
    .group a {
      display: block; padding: 0.35rem 0.5rem; border-radius: 0.375rem;
      color: var(--muted); font-size: 0.9rem;
    }
    .group a:hover, .group a.active { background: rgb(0 146 249 / 0.12); color: var(--fg); text-decoration: none; }
    .group a.active { color: var(--cyber); }
    main { padding: 2rem 2.5rem 4rem; max-width: 52rem; }
    main h1 { font-size: 2rem; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
    main .desc { color: var(--muted); margin-bottom: 2rem; }
    main h2 { margin-top: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; }
    main h3 { margin-top: 1.5rem; }
    main code { background: var(--card); padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.9em; }
    main pre { background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; overflow: auto; }
    main pre code { background: none; padding: 0; }
    main table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.95rem; }
    main th, main td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
    main th { background: var(--card); }
    main blockquote { border-left: 3px solid var(--primary); margin: 1rem 0; padding: 0.5rem 1rem; color: var(--muted); background: rgb(0 146 249 / 0.06); }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <a class="brand" href="${href("introduction")}">
        <div class="brand-mark">B</div>
        <div>
          <strong>Beacon</strong>
          <span>Docs</span>
        </div>
      </a>
      ${navHtml}
    </aside>
    <main>
      <h1>${escapeHtml(title)}</h1>
      ${description ? `<p class="desc">${escapeHtml(description)}</p>` : ""}
      ${content}
      <footer>Beacon documentation · <a href="https://github.com/fynx-security/beacon-docs">Edit on GitHub</a></footer>
    </main>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadPage(page) {
  const candidates = [join(ROOT, `${page}.mdx`), join(ROOT, `${page}.md`)];
  for (const file of candidates) {
    try {
      const raw = await readFile(file, "utf8");
      return { page, ...stripFrontmatter(raw) };
    } catch {
      /* try next */
    }
  }
  throw new Error(`Missing page: ${page}`);
}

async function main() {
  const docs = JSON.parse(await readFile(join(ROOT, "docs.json"), "utf8"));
  const pages = [];
  const groups = [];

  for (const tab of docs.navigation.tabs) {
    for (const group of tab.groups) {
      groups.push({
        tab: tab.tab,
        name: group.group,
        pages: group.pages,
      });
      pages.push(...group.pages);
    }
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  try {
    await cp(join(ROOT, "favicon.svg"), join(OUT, "favicon.svg"));
  } catch { /* optional */ }
  try {
    await cp(join(ROOT, "logo"), join(OUT, "logo"), { recursive: true });
  } catch { /* optional */ }
  await writeFile(join(OUT, ".nojekyll"), "");

  const loaded = [];
  for (const page of pages) {
    loaded.push(await loadPage(page));
  }

  function navHtml(active) {
    return groups
      .map((g) => {
        const links = g.pages
          .map((p) => {
            const item = loaded.find((x) => x.page === p);
            const label = item?.meta?.title || p.split("/").pop();
            const cls = p === active ? "active" : "";
            return `<a class="${cls}" href="${href(p === "introduction" ? "introduction" : p)}">${escapeHtml(label)}</a>`;
          })
          .join("\n");
        return `<div class="group"><h2>${escapeHtml(g.name)}</h2>${links}</div>`;
      })
      .join("\n");
  }

  for (const item of loaded) {
    const md = mdxToMarkdown(item.body);
    let html = marked.parse(md, { async: false });
    html = rewriteInternalLinks(html);
    const title = item.meta.title || item.page;
    const outPath = pageToOutPath(item.page);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(
      outPath,
      layout({
        title,
        description: item.meta.description,
        navHtml: navHtml(item.page),
        content: html,
        active: item.page,
      }),
    );
    console.log("built", relative(OUT, outPath));
  }

  console.log(`Done — ${loaded.length} pages → ${OUT} (base ${BASE || "/"})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
