// Screenshot one or more app routes with Playwright (headless Chromium).
//
// The app is a hash-routed PWA with an in-browser MSW mock backend. By default
// this script injects a fully-onboarded "Amina" profile into localStorage so
// authenticated routes (the dashboard, discovery, etc.) render directly without
// clicking through onboarding. See .claude/skills/screenshot-app/SKILL.md.
//
// Usage:
//   1. Start the dev server in another terminal:  npm run dev
//      Note the port it prints (5173, or 5174 if 5173 is taken).
//   2. node scripts/screenshot-routes.mjs <routes> [options]
//
//   <routes>            comma-separated hash routes
//                       e.g. /patients,/patients/search,/patients/facility/1
// Options:
//   --base <url>        dev origin (default http://localhost:5173)
//   --out <dir>         output dir for PNGs (default ./.screenshots)
//   --desktop           also capture a 1280x900 shot per route (suffix -desktop)
//   --width <n>         mobile viewport width (default 390)
//   --height <n>        mobile viewport height (default 844)
//   --no-seed           skip the onboarded-profile injection (e.g. for auth screens)
//   --wait <ms>         settle time after each navigation (default 2500)
//
// Example:
//   node scripts/screenshot-routes.mjs /patients,/patients/profile --desktop

import { chromium } from "playwright"
import { readFileSync, mkdirSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function parseArgs(argv) {
  const out = {
    base: "http://localhost:5173",
    out: resolve(ROOT, ".screenshots"),
    desktop: false,
    width: 390,
    height: 844,
    seed: true,
    wait: 2500,
    routes: [],
  }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === "--base") out.base = argv[++i]
    else if (a === "--out") out.out = resolve(argv[++i])
    else if (a === "--desktop") out.desktop = true
    else if (a === "--no-seed") out.seed = false
    else if (a === "--width") out.width = Number(argv[++i])
    else if (a === "--height") out.height = Number(argv[++i])
    else if (a === "--wait") out.wait = Number(argv[++i])
    else if (!a.startsWith("--"))
      out.routes.push(...a.split(",").filter(Boolean))
  }
  return out
}

// Keep the injected mock state in sync with the mock harness without importing
// its TS modules: SEED_VERSION changes over time and a mismatch makes the app
// wipe our injected profile on boot.
function readSeedVersion() {
  const db = readFileSync(resolve(ROOT, "src/mocks/db.ts"), "utf8")
  const m = db.match(/SEED_VERSION\s*=\s*["'`]([^"'`]+)["'`]/)
  if (!m) throw new Error("Could not read SEED_VERSION from src/mocks/db.ts")
  return m[1]
}

const ONBOARDED_PROFILE = JSON.parse(
  readFileSync(
    resolve(ROOT, "src/mocks/fixtures/patient-login-details.json"),
    "utf8"
  )
)

function slug(route) {
  return route.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-") || "root"
}

async function injectOnboardedSession(page, seedVersion) {
  await page.evaluate(
    ({ profile, seedVersion }) => {
      localStorage.setItem("mock:login-details", JSON.stringify(profile))
      localStorage.setItem("mock:__seed_version__", seedVersion)
      localStorage.setItem("mock_session_exists", "true")
      localStorage.setItem("mock_has_account", "true")
      localStorage.setItem("mock_user_id", "patient-001")
    },
    { profile: ONBOARDED_PROFILE, seedVersion }
  )
}

async function capture(ctx, opts, routes, suffix) {
  const page = await ctx.newPage()
  page.on("console", (m) => {
    if (m.type() === "error") console.log("[console.error]", m.text())
  })
  if (opts.seed) {
    // Land once so the origin exists, then seed and reload into the first route.
    await page.goto(`${opts.base}/#${routes[0]}`, {
      waitUntil: "networkidle",
      timeout: 45000,
    })
    await page.waitForTimeout(1200)
    await injectOnboardedSession(page, opts.seedVersion)
  }
  for (const route of routes) {
    await page.goto(`${opts.base}/#${route}`, {
      waitUntil: "networkidle",
      timeout: 45000,
    })
    await page.waitForTimeout(opts.wait)
    await page.waitForLoadState("networkidle").catch(() => {})
    const name = `${slug(route)}${suffix}.png`
    await page.screenshot({ path: resolve(opts.out, name) })
    console.log("shot:", name, "→", page.url())
  }
  await page.close()
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.routes.length === 0) {
    console.error(
      "No routes given. Example: node scripts/screenshot-routes.mjs /patients --desktop"
    )
    process.exit(1)
  }
  opts.seedVersion = readSeedVersion()
  mkdirSync(opts.out, { recursive: true })

  const browser = await chromium.launch()
  try {
    const mobile = await browser.newContext({
      viewport: { width: opts.width, height: opts.height },
      deviceScaleFactor: 2,
    })
    await capture(mobile, opts, opts.routes, "")

    if (opts.desktop) {
      const desktop = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      })
      await capture(desktop, opts, opts.routes, "-desktop")
    }
    console.log("\nDone. PNGs in:", opts.out)
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message)
  process.exit(1)
})
