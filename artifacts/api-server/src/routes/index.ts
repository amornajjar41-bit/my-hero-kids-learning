import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import ttsRouter from "./tts";
import transcribeRouter from "./transcribe";
import parentRouter from "./parent";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(ttsRouter);
router.use(transcribeRouter);
router.use(parentRouter);

export default router;
