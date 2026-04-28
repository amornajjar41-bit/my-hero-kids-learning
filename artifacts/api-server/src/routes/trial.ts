/**
 * 5B – Trial usage tracking.
 * Tracks TTS seconds, STT seconds, and photo uploads per user.
 * Limits: TTS 900s (15min), STT 900s (15min), Photos 1 total.
 */
import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const TRIAL_LIMITS = {
  tts_seconds: 900,   // 15 minutes
  stt_seconds: 900,   // 15 minutes
  photos: 1,
};

async function getUserIdFromSession(sessionToken: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", `session:${sessionToken}`)
      .maybeSingle();
    return data?.value ?? null;
  } catch {
    return null;
  }
}

// GET /api/trial/usage  – returns usage and whether limits are reached
router.get("/trial/usage", async (req, res) => {
  try {
    const sessionToken = (req.headers["x-session-token"] as string) || (req.query.session as string);
    if (!sessionToken) return res.status(401).json({ error: "missing session token" });

    const userId = await getUserIdFromSession(sessionToken);
    if (!userId) return res.status(401).json({ error: "invalid session" });

    const { data: user } = await supabase
      .from("users")
      .select("trial_tts_used_seconds, trial_stt_used_seconds, trial_photos_used, subscription_plan, trial_start")
      .eq("id", userId)
      .maybeSingle();

    if (!user) return res.status(404).json({ error: "user not found" });

    const isPaid = user.subscription_plan !== "trial";

    return res.json({
      tts: {
        usedSeconds: user.trial_tts_used_seconds ?? 0,
        limitSeconds: TRIAL_LIMITS.tts_seconds,
        blocked: !isPaid && (user.trial_tts_used_seconds ?? 0) >= TRIAL_LIMITS.tts_seconds,
      },
      stt: {
        usedSeconds: user.trial_stt_used_seconds ?? 0,
        limitSeconds: TRIAL_LIMITS.stt_seconds,
        blocked: !isPaid && (user.trial_stt_used_seconds ?? 0) >= TRIAL_LIMITS.stt_seconds,
      },
      photos: {
        used: user.trial_photos_used ?? 0,
        limit: TRIAL_LIMITS.photos,
        blocked: !isPaid && (user.trial_photos_used ?? 0) >= TRIAL_LIMITS.photos,
      },
      isPaid,
      trialStart: user.trial_start,
    });
  } catch (err) {
    req.log.error({ err }, "trial usage error");
    return res.status(500).json({ error: "failed" });
  }
});

// POST /api/trial/usage – increment usage
router.post("/trial/usage", async (req, res) => {
  try {
    const sessionToken = (req.headers["x-session-token"] as string);
    if (!sessionToken) return res.status(401).json({ error: "missing session token" });

    const { type, seconds } = req.body as {
      type: "tts" | "stt" | "photo";
      seconds?: number;
    };

    const userId = await getUserIdFromSession(sessionToken);
    if (!userId) return res.status(401).json({ error: "invalid session" });

    const { data: user } = await supabase
      .from("users")
      .select("trial_tts_used_seconds, trial_stt_used_seconds, trial_photos_used, subscription_plan")
      .eq("id", userId)
      .maybeSingle();

    if (!user) return res.status(404).json({ error: "user not found" });

    const isPaid = user.subscription_plan !== "trial";
    if (isPaid) return res.json({ ok: true, blocked: false });

    let updatePayload: Record<string, number> = {};
    let blocked = false;

    if (type === "tts") {
      const used = (user.trial_tts_used_seconds ?? 0) + (seconds ?? 0);
      updatePayload.trial_tts_used_seconds = used;
      blocked = used >= TRIAL_LIMITS.tts_seconds;
    } else if (type === "stt") {
      const used = (user.trial_stt_used_seconds ?? 0) + (seconds ?? 0);
      updatePayload.trial_stt_used_seconds = used;
      blocked = used >= TRIAL_LIMITS.stt_seconds;
    } else if (type === "photo") {
      const used = (user.trial_photos_used ?? 0) + 1;
      updatePayload.trial_photos_used = used;
      blocked = used > TRIAL_LIMITS.photos;
    }

    await supabase.from("users").update(updatePayload).eq("id", userId);

    return res.json({ ok: true, blocked });
  } catch (err) {
    req.log.error({ err }, "trial update error");
    return res.status(500).json({ error: "failed" });
  }
});

// Check photo limit before allowing upload
router.post("/trial/check-photo", async (req, res) => {
  try {
    const sessionToken = (req.headers["x-session-token"] as string);
    if (!sessionToken) return res.json({ allowed: true }); // graceful fallback

    const userId = await getUserIdFromSession(sessionToken);
    if (!userId) return res.json({ allowed: true });

    const { data: user } = await supabase
      .from("users")
      .select("trial_photos_used, subscription_plan")
      .eq("id", userId)
      .maybeSingle();

    if (!user) return res.json({ allowed: true });

    const isPaid = user.subscription_plan !== "trial";
    const allowed = isPaid || (user.trial_photos_used ?? 0) < TRIAL_LIMITS.photos;

    return res.json({ allowed, used: user.trial_photos_used ?? 0, limit: TRIAL_LIMITS.photos });
  } catch {
    return res.json({ allowed: true });
  }
});

export default router;
