/**
 * Push Notifications — token registration + server-side sends
 *
 * POST /api/notifications/register
 *   Body: { token: string; userId?: string; platform: "ios"|"android" }
 *   Stores the Expo push token in Supabase for future targeted sends.
 *
 * POST /api/notifications/send-all  (admin)
 *   Broadcasts a message to all registered devices.
 *
 * POST /api/notifications/send-test (admin)
 *   Sends a single test notification to a specific token.
 */
import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase.js";

const router: IRouter = Router();

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  sound?: "default" | null;
  data?: Record<string, unknown>;
  channelId?: string;
}

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
  });
}

// ── Register push token ───────────────────────────────────────────────────────
router.post("/notifications/register", async (req, res) => {
  const { token, userId, platform } = req.body as {
    token?: string;
    userId?: string;
    platform?: string;
  };

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "token required" });
  }

  if (!token.startsWith("ExponentPushToken[")) {
    return res.status(400).json({ error: "invalid Expo push token" });
  }

  try {
    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          token,
          user_id: userId ?? null,
          platform: platform ?? "unknown",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

    if (error) {
      req.log.warn({ err: error.message }, "push_tokens upsert warning");
    }

    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "notifications/register error");
    return res.status(500).json({ error: "registration failed" });
  }
});

// ── Broadcast to all registered tokens ───────────────────────────────────────
router.post("/notifications/send-all", async (req, res) => {
  const { title, body, data } = req.body as {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  };

  if (!title || !body) {
    return res.status(400).json({ error: "title and body required" });
  }

  try {
    const { data: rows, error } = await supabase
      .from("push_tokens")
      .select("token")
      .limit(500);

    if (error || !rows || rows.length === 0) {
      return res.json({ ok: true, sent: 0, message: "No tokens registered" });
    }

    const tokens = rows.map((r: { token: string }) => r.token);

    // Expo recommends chunks of 100
    const CHUNK = 100;
    let sent = 0;
    for (let i = 0; i < tokens.length; i += CHUNK) {
      const chunk = tokens.slice(i, i + CHUNK);
      const messages: ExpoPushMessage[] = chunk.map((to: string) => ({
        to,
        title,
        body,
        sound: "default",
        data: data ?? {},
      }));
      await sendExpoPush(messages);
      sent += chunk.length;
    }

    return res.json({ ok: true, sent });
  } catch (err) {
    req.log.error({ err }, "notifications/send-all error");
    return res.status(500).json({ error: "send failed" });
  }
});

// ── Test send to single token ─────────────────────────────────────────────────
router.post("/notifications/send-test", async (req, res) => {
  const { token, title, body } = req.body as {
    token?: string;
    title?: string;
    body?: string;
  };

  if (!token || !title || !body) {
    return res.status(400).json({ error: "token, title and body required" });
  }

  try {
    await sendExpoPush([{ to: token, title, body, sound: "default" }]);
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "notifications/send-test error");
    return res.status(500).json({ error: "test send failed" });
  }
});

export default router;
