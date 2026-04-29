import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "./routes/index.js";
import { logger, type AppLogger } from "./lib/logger.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      log: AppLogger;
    }
  }
}

const app: Express = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  req.log = logger.child({ reqId: Math.random().toString(36).slice(2, 8) });
  res.on("finish", () => {
    req.log.info(
      { method: req.method, url: req.url.split("?")[0], status: res.statusCode, ms: Date.now() - start },
      "request",
    );
  });
  next();
});

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use("/api", router);

app.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Hero — Kids Learning</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      color: #fff;
      padding: 24px;
    }

    .card {
      background: rgba(255,255,255,0.07);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.13);
      border-radius: 28px;
      padding: 52px 44px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 32px 80px rgba(0,0,0,0.4);
    }

    .hero-emoji {
      font-size: 72px;
      line-height: 1;
      margin-bottom: 20px;
      display: block;
      animation: float 3.5s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-10px); }
    }

    h1 {
      font-size: 2.1rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #fff 30%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }

    .tagline {
      font-size: 1rem;
      color: rgba(255,255,255,0.55);
      margin-bottom: 32px;
      letter-spacing: 0.02em;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16,185,129,0.15);
      border: 1px solid rgba(16,185,129,0.35);
      color: #6ee7b7;
      font-size: 0.88rem;
      font-weight: 600;
      padding: 8px 18px;
      border-radius: 100px;
      margin-bottom: 40px;
      letter-spacing: 0.03em;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 1.8s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(0.85); }
    }

    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.08);
      margin: 0 0 32px;
    }

    .download-label {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.35);
      margin-bottom: 18px;
    }

    .store-buttons {
      display: flex;
      gap: 14px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .store-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.09);
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 14px;
      padding: 13px 22px;
      text-decoration: none;
      color: #fff;
      font-size: 0.92rem;
      font-weight: 600;
      transition: background 0.2s, transform 0.15s;
      cursor: default;
    }

    .store-btn:hover {
      background: rgba(255,255,255,0.15);
      transform: translateY(-2px);
    }

    .store-icon { font-size: 1.5rem; line-height: 1; }

    .store-sub {
      font-size: 0.68rem;
      font-weight: 400;
      color: rgba(255,255,255,0.5);
      display: block;
      margin-bottom: 1px;
    }

    .footer {
      margin-top: 36px;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.2);
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="hero-emoji">🦸</span>
    <h1>My Hero</h1>
    <p class="tagline">Personalised learning for curious kids aged 3 – 15</p>

    <div class="status-pill">
      <span class="dot"></span>
      API is running
    </div>

    <hr class="divider" />

    <p class="download-label">Coming soon to</p>
    <div class="store-buttons">
      <div class="store-btn">
        <span class="store-icon">🍎</span>
        <div>
          <span class="store-sub">Download on the</span>
          App Store
        </div>
      </div>
      <div class="store-btn">
        <span class="store-icon">▶️</span>
        <div>
          <span class="store-sub">Get it on</span>
          Google Play
        </div>
      </div>
    </div>

    <p class="footer">© ${new Date().getFullYear()} My Hero — Kids Learning</p>
  </div>
</body>
</html>`);
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const msg = err instanceof Error ? err.message : String(err);
  logger.error({ err: msg }, "unhandled error");
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
