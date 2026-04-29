import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "./routes";
import { logger } from "./lib/logger";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      log: typeof logger;
    }
  }
}

const app: Express = express();

// Lightweight request logger — attaches req.log and logs method/url/status/ms.
// Replaces pino-http to avoid thread-stream worker threads in serverless.
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

export default app;
