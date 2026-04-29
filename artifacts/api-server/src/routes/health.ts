import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/version", (_req, res) => {
  res.json({
    status: "ok",
    build: "v5-sync-logger-no-pino-http",
    node: process.version,
    env: process.env.NODE_ENV ?? "unknown",
  });
});

export default router;
