/**
 * Standalone production server for Expo static builds.
 *
 * Routes:
 * - GET / or /manifest with expo-platform: ios|android header → native manifest JSON (for Expo Go)
 * - GET any path, browser (no expo-platform header), web-dist exists → serve Expo web export (SPA)
 * - GET / browser, no web-dist → landing page HTML fallback
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT  = path.resolve(__dirname, "..", "static-build");
const WEB_DIST     = path.resolve(__dirname, "..", "web-dist");
const TEMPLATE_PATH = path.resolve(__dirname, "templates", "landing-page.html");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".otf":  "font/otf",
  ".map":  "application/json",
  ".webp": "image/webp",
  ".mp3":  "audio/mpeg",
  ".wav":  "audio/wav",
};

function getAppName() {
  try {
    const appJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "app.json"), "utf-8"));
    return appJson.expo?.name || "My Hero";
  } catch { return "My Hero"; }
}

// ─── Native manifest (Expo Go) ────────────────────────────────────────────────
function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `Manifest not found for platform: ${platform}` }));
    return;
  }
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

// ─── Expo web export (browser) ───────────────────────────────────────────────
const webDistExists = fs.existsSync(path.join(WEB_DIST, "index.html"));

function serveWebApp(pathname, res) {
  // Strip leading /
  const relative = pathname.replace(/^\//, "");
  const candidates = [
    path.join(WEB_DIST, relative),
    path.join(WEB_DIST, relative, "index.html"),
  ];

  for (const filePath of candidates) {
    const safe = path.normalize(filePath);
    if (!safe.startsWith(WEB_DIST)) continue;
    if (fs.existsSync(safe) && !fs.statSync(safe).isDirectory()) {
      const ext = path.extname(safe).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "content-type": contentType });
      res.end(fs.readFileSync(safe));
      return;
    }
  }

  // SPA fallback — serve index.html for any unmatched route
  const indexPath = path.join(WEB_DIST, "index.html");
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(fs.readFileSync(indexPath));
}

// ─── Landing page fallback ────────────────────────────────────────────────────
const landingPageTemplate = fs.existsSync(TEMPLATE_PATH)
  ? fs.readFileSync(TEMPLATE_PATH, "utf-8")
  : "<html><body><h1>My Hero</h1><p>Download Expo Go to use this app.</p></body></html>";
const appName = getAppName();

function serveLandingPage(req, res) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host     = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  const baseUrl  = `${protocol}://${host}`;
  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, host)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

// ─── Static fallback (native bundles) ────────────────────────────────────────
function serveStaticFile(urlPath, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);
  if (!filePath.startsWith(STATIC_ROOT)) { res.writeHead(403); res.end("Forbidden"); return; }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); res.end("Not Found"); return; }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "content-type": MIME_TYPES[ext] || "application/octet-stream" });
  res.end(fs.readFileSync(filePath));
}

// ─── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url      = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname   = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  // Native Expo Go requests
  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveManifest(platform, res);
    }
  }

  // Browser request — serve full web app if export exists
  const platform = req.headers["expo-platform"];
  if (!platform || (platform !== "ios" && platform !== "android")) {
    if (webDistExists) {
      return serveWebApp(pathname, res);
    }
    if (pathname === "/") {
      return serveLandingPage(req, res);
    }
  }

  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`✅ My Hero production server on port ${port}`);
  console.log(`   Web app: ${webDistExists ? "✅ serving from web-dist/" : "⚠️  web-dist/ not found, using landing page"}`);
  console.log(`   Native:  static-build/ (Expo Go)`);
});
