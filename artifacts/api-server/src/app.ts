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

// ── Privacy Policy (required by both app stores) ─────────────────────────────
app.get("/privacy", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Privacy Policy — My Hero Kids Learning</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f0c29;color:#e5e7eb;min-height:100vh;padding:24px 16px 60px}
    .wrap{max-width:780px;margin:0 auto}
    h1{font-size:2rem;font-weight:800;color:#fff;margin-bottom:6px}
    .subtitle{color:rgba(255,255,255,0.45);font-size:.9rem;margin-bottom:40px}
    h2{font-size:1.15rem;font-weight:700;color:#a78bfa;margin:32px 0 12px}
    p,li{font-size:.95rem;line-height:1.75;color:rgba(255,255,255,0.75);margin-bottom:10px}
    ul{padding-left:20px;margin-bottom:10px}
    a{color:#818cf8;text-decoration:none}
    a:hover{text-decoration:underline}
    .badge{display:inline-block;background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.3);color:#c4b5fd;font-size:.75rem;font-weight:700;padding:3px 10px;border-radius:100px;margin-bottom:18px;letter-spacing:.05em}
  </style>
</head>
<body>
  <div class="wrap">
    <p style="margin-bottom:18px"><a href="/">← myheroapp.org</a></p>
    <span class="badge">COPPA &amp; GDPR COMPLIANT</span>
    <h1>Privacy Policy</h1>
    <p class="subtitle">My Hero Education Ltd · Last updated: ${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p>

    <h2>1. Who We Are</h2>
    <p>My Hero is an AI-powered educational application ("App") for children aged 4–14, developed by My Hero Education Ltd ("we", "our", "us"). Our website is <a href="https://www.myheroapp.org">www.myheroapp.org</a> and you can contact us at <a href="mailto:support@myheroapp.org">support@myheroapp.org</a>.</p>

    <h2>2. Children's Privacy &amp; COPPA Compliance</h2>
    <p>We take children's privacy extremely seriously. My Hero is designed to be used by children under parental supervision. We comply fully with the Children's Online Privacy Protection Act (COPPA) and the EU General Data Protection Regulation (GDPR).</p>
    <ul>
      <li>Children under 13 may only use the App with verified parental consent.</li>
      <li>We collect only the minimum data necessary to provide the educational service.</li>
      <li>We do <strong>not</strong> sell, share, or rent any personal data — ever.</li>
      <li>We do <strong>not</strong> display any third-party advertising to children.</li>
      <li>We do <strong>not</strong> use behavioural tracking or profiling of children.</li>
      <li>Parents may request complete deletion of their child's data at any time.</li>
    </ul>

    <h2>3. What Data We Collect</h2>
    <ul>
      <li><strong>Parent email address</strong> — used for account login and subscription management only.</li>
      <li><strong>Child's first name and age group</strong> — used to personalise lesson content.</li>
      <li><strong>Voice recordings</strong> — recorded locally on-device, transcribed via AssemblyAI, then immediately discarded. We do not store voice recordings.</li>
      <li><strong>Homework photos</strong> — processed on-device and sent to our server for AI analysis only. Not stored beyond the session.</li>
      <li><strong>Learning progress</strong> — stars earned, lessons completed, streak count — stored securely to enable continuity across sessions.</li>
      <li><strong>Device type and OS version</strong> — used for crash reporting and compatibility improvements only.</li>
    </ul>

    <h2>4. How We Use Data</h2>
    <ul>
      <li>To deliver personalised AI learning experiences.</li>
      <li>To allow parents to monitor their child's progress.</li>
      <li>To process subscription payments via RevenueCat / Apple / Google.</li>
      <li>To send optional push notifications about learning reminders (parents can disable at any time).</li>
      <li>To improve the App's educational content and performance.</li>
    </ul>

    <h2>5. AI Voice &amp; Chat</h2>
    <p>My Hero uses OpenAI GPT-4o-mini to power AI conversations and Google Neural2 Text-to-Speech for audio responses. Voice questions are transcribed via AssemblyAI. These services receive the text of questions only — no personally identifying information is sent. All third-party AI processing agreements include data processing agreements ensuring GDPR compliance.</p>

    <h2>6. Data Storage &amp; Security</h2>
    <p>All data is stored encrypted at rest on Supabase (EU-region servers). We use HTTPS/TLS for all data in transit. We conduct regular security reviews and follow industry best practices for data protection.</p>

    <h2>7. Parental Rights</h2>
    <p>Parents and guardians have the right to:</p>
    <ul>
      <li>Access all data held about their child.</li>
      <li>Request correction of inaccurate data.</li>
      <li>Request complete deletion of all data ("right to be forgotten").</li>
      <li>Withdraw consent at any time by deleting the account.</li>
      <li>Object to processing or request data portability.</li>
    </ul>
    <p>To exercise any of these rights, email <a href="mailto:support@myheroapp.org">support@myheroapp.org</a>. We will respond within 30 days.</p>

    <h2>8. Data Retention</h2>
    <p>We retain account data for as long as the account is active. If an account is deleted, all personal data is removed within 30 days. Anonymised, aggregated usage statistics (which cannot identify any individual) may be retained for service improvement.</p>

    <h2>9. Third-Party Services</h2>
    <p>My Hero uses the following third-party services, each with their own privacy policies:</p>
    <ul>
      <li><a href="https://openai.com/privacy" target="_blank">OpenAI</a> — AI responses</li>
      <li><a href="https://cloud.google.com/terms/cloud-privacy-notice" target="_blank">Google Cloud</a> — Text-to-Speech</li>
      <li><a href="https://www.assemblyai.com/legal/privacy-policy" target="_blank">AssemblyAI</a> — Speech recognition</li>
      <li><a href="https://www.revenuecat.com/privacy" target="_blank">RevenueCat</a> — Subscription management</li>
      <li><a href="https://supabase.com/privacy" target="_blank">Supabase</a> — Data storage</li>
      <li><a href="https://expo.dev/privacy" target="_blank">Expo</a> — Push notifications</li>
    </ul>

    <h2>10. International Transfers</h2>
    <p>Our servers are located in the European Union. Where data is processed outside the EU (e.g. by OpenAI in the US), we ensure appropriate safeguards are in place, including Standard Contractual Clauses as required by GDPR.</p>

    <h2>11. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or in-app notification. Continued use of the App after changes constitutes acceptance of the updated policy.</p>

    <h2>12. Contact Us</h2>
    <p>For any privacy questions or requests:<br/>
    Email: <a href="mailto:support@myheroapp.org">support@myheroapp.org</a><br/>
    Website: <a href="https://www.myheroapp.org">www.myheroapp.org</a></p>
  </div>
</body>
</html>`);
});

// ── Terms of Service ──────────────────────────────────────────────────────────
app.get("/terms", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Terms of Service — My Hero Kids Learning</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f0c29;color:#e5e7eb;min-height:100vh;padding:24px 16px 60px}
    .wrap{max-width:780px;margin:0 auto}
    h1{font-size:2rem;font-weight:800;color:#fff;margin-bottom:6px}
    .subtitle{color:rgba(255,255,255,0.45);font-size:.9rem;margin-bottom:40px}
    h2{font-size:1.15rem;font-weight:700;color:#a78bfa;margin:32px 0 12px}
    p,li{font-size:.95rem;line-height:1.75;color:rgba(255,255,255,0.75);margin-bottom:10px}
    ul{padding-left:20px;margin-bottom:10px}
    a{color:#818cf8;text-decoration:none}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="wrap">
    <p style="margin-bottom:18px"><a href="/">← myheroapp.org</a></p>
    <h1>Terms of Service</h1>
    <p class="subtitle">My Hero Education Ltd · Last updated: ${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By downloading, installing, or using My Hero ("App"), the parent or legal guardian ("you") agrees to these Terms on behalf of themselves and their child. If you do not agree, please do not use the App.</p>

    <h2>2. Eligibility</h2>
    <p>My Hero is designed for children aged 4–14. Parents or legal guardians must create and manage the account. Children must not create accounts independently. You represent that you are at least 18 years old and have the legal right to enter into this agreement.</p>

    <h2>3. Subscriptions &amp; Billing</h2>
    <ul>
      <li><strong>Free trial:</strong> 3 days — no payment required.</li>
      <li><strong>Monthly plan:</strong> $24.99/month</li>
      <li><strong>6-Month plan:</strong> $135.99 (billed every 6 months)</li>
      <li><strong>Annual plan:</strong> $236.99/year</li>
      <li>Subscriptions are managed and billed through Apple App Store or Google Play Store.</li>
      <li>Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date.</li>
      <li>You can cancel at any time through your App Store or Play Store account settings.</li>
      <li>After cancellation, access continues until the end of the current billing period.</li>
      <li>No refunds for partial subscription periods, except where required by applicable law.</li>
    </ul>

    <h2>4. Acceptable Use</h2>
    <p>You agree to use the App for educational purposes only. You must not:</p>
    <ul>
      <li>Attempt to circumvent any safety systems, content filters, or parental controls.</li>
      <li>Use the App to generate, store, or distribute harmful or inappropriate content.</li>
      <li>Reverse engineer, copy, or redistribute any part of the App.</li>
      <li>Share account credentials with others outside your immediate family.</li>
    </ul>

    <h2>5. AI-Powered Content</h2>
    <p>My Hero uses artificial intelligence to generate educational responses. While we work hard to ensure accuracy and age-appropriateness, AI can occasionally make mistakes. Important academic decisions should be verified with qualified educators. We are not responsible for inaccuracies in AI-generated content.</p>

    <h2>6. Safety Monitoring</h2>
    <p>We monitor AI conversations using automated safety systems. If concerning content is detected, parents are alerted immediately. We reserve the right to suspend accounts that misuse the AI system.</p>

    <h2>7. Intellectual Property</h2>
    <p>All content, characters, lessons, stories, and software in the App are owned by My Hero Education Ltd. You are granted a limited, non-exclusive, non-transferable licence to use the App for personal, non-commercial educational purposes.</p>

    <h2>8. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, My Hero Education Ltd shall not be liable for any indirect, incidental, special, or consequential damages arising from use of the App. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.</p>

    <h2>9. Governing Law</h2>
    <p>These Terms are governed by the laws of England and Wales. Any disputes shall be resolved in the courts of England and Wales.</p>

    <h2>10. Changes to Terms</h2>
    <p>We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the updated Terms. We will notify you of material changes by email.</p>

    <h2>11. Contact</h2>
    <p>Email: <a href="mailto:support@myheroapp.org">support@myheroapp.org</a><br/>
    Website: <a href="https://www.myheroapp.org">www.myheroapp.org</a></p>
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
