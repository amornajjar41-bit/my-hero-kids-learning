import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import chatRouter from "./chat.js";
import ttsRouter from "./tts.js";
import transcribeRouter from "./transcribe.js";
import parentRouter from "./parent.js";
import safetyRouter from "./safety.js";
import authRouter from "./auth.js";
import setupRouter, { runSetup } from "./setup.js";
import trialRouter from "./trial.js";
import adminRouter from "./admin.js";
import audioRouter from "./audio.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(ttsRouter);
router.use(transcribeRouter);
router.use(parentRouter);
router.use(safetyRouter);
router.use(authRouter);
router.use(setupRouter);
router.use(trialRouter);
router.use(adminRouter);
router.use(audioRouter);

// Run DB setup on startup (non-blocking)
runSetup().catch(console.error);

export default router;
