import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import ttsRouter from "./tts";
import transcribeRouter from "./transcribe";
import parentRouter from "./parent";
import safetyRouter from "./safety";
import authRouter from "./auth";
import setupRouter, { runSetup } from "./setup";
import trialRouter from "./trial";

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

// Run DB setup on startup (non-blocking)
runSetup().catch(console.error);

export default router;
