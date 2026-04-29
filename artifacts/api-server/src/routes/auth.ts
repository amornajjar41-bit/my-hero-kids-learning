import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { supabase } from "../lib/supabase.js";
import { sendEmail, pinResetHtml } from "../lib/email.js";

const router: IRouter = Router();

// ─── Register ─────────────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res) => {
  try {
    const {
      email,
      password,
      parentName,
      country,
      currency,
      language,
      childName,
      childGender,
      childDob,
      characterChoice,
      languagePreference,
    } = req.body as {
      email: string;
      password: string;
      parentName: string;
      country: string;
      currency: string;
      language: string;
      childName: string;
      childGender: "boy" | "girl";
      childDob: string;
      characterChoice: "boy" | "girl";
      languagePreference: "en" | "ar";
    };

    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: "email_exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const sessionToken = randomUUID();
    const now = new Date().toISOString();

    // Calculate age group from DOB
    let ageGroup = "7-9";
    if (childDob) {
      const age = new Date().getFullYear() - new Date(childDob).getFullYear();
      if (age <= 6) ageGroup = "4-6";
      else if (age <= 9) ageGroup = "7-9";
      else if (age <= 12) ageGroup = "10-12";
      else ageGroup = "13-14";
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        parent_name: parentName,
        country,
        currency,
        language: language ?? "en",
        created_at: now,
        subscription_plan: "trial",
        subscription_status: "trial",
        trial_start: now,
        trial_tts_used_seconds: 0,
        trial_stt_used_seconds: 0,
        trial_photos_used: 0,
        pin_hash: passwordHash,
      })
      .select("id")
      .single();

    if (userError || !user) {
      req.log.error({ userError }, "user insert error");
      return res.status(500).json({ error: "registration_failed" });
    }

    // Create child profile
    const { data: child } = await supabase
      .from("children")
      .insert({
        user_id: user.id,
        child_name: childName,
        gender: childGender,
        date_of_birth: childDob ?? null,
        character_choice: characterChoice ?? childGender,
        age_group: ageGroup,
        language_preference: languagePreference ?? language ?? "en",
        last_active: now,
      })
      .select("id")
      .single();

    // Save session
    await supabase
      .from("app_settings")
      .upsert({ key: `session:${sessionToken}`, value: user.id }, { onConflict: "key" });

    return res.json({
      sessionToken,
      userId: user.id,
      childId: child?.id,
      trialStart: now,
      ageGroup,
    });
  } catch (err) {
    req.log.error({ err }, "register error");
    return res.status(500).json({ error: "registration_failed" });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, pin_hash, subscription_plan, subscription_status, trial_start, parent_name, country, currency, language")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const valid = await bcrypt.compare(password, user.pin_hash ?? "");
    if (!valid) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const sessionToken = randomUUID();
    await supabase
      .from("app_settings")
      .upsert({ key: `session:${sessionToken}`, value: user.id }, { onConflict: "key" });

    const { data: child } = await supabase
      .from("children")
      .select("id, child_name, gender, character_choice, age_group, language_preference, streak_days, total_points")
      .eq("user_id", user.id)
      .maybeSingle();

    return res.json({
      sessionToken,
      userId: user.id,
      childId: child?.id,
      user: {
        parentName: user.parent_name,
        country: user.country,
        currency: user.currency,
        language: user.language,
        subscriptionPlan: user.subscription_plan,
        subscriptionStatus: user.subscription_status,
        trialStart: user.trial_start,
      },
      child: child
        ? {
            childName: child.child_name,
            gender: child.gender,
            characterChoice: child.character_choice,
            ageGroup: child.age_group,
            languagePreference: child.language_preference,
            streak: child.streak_days,
            points: child.total_points,
          }
        : null,
    });
  } catch (err) {
    req.log.error({ err }, "login error");
    return res.status(500).json({ error: "login_failed" });
  }
});

// ─── Validate session ─────────────────────────────────────────────────────────
router.post("/auth/validate", async (req, res) => {
  try {
    const { sessionToken } = req.body as { sessionToken: string };

    if (!sessionToken) {
      return res.status(401).json({ error: "no_token" });
    }

    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", `session:${sessionToken}`)
      .maybeSingle();

    if (!setting) {
      return res.status(401).json({ error: "invalid_token" });
    }

    const userId = setting.value;

    const { data: user } = await supabase
      .from("users")
      .select("id, parent_name, country, currency, language, subscription_plan, subscription_status, trial_start")
      .eq("id", userId)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ error: "user_not_found" });
    }

    const { data: child } = await supabase
      .from("children")
      .select("id, child_name, gender, character_choice, age_group, language_preference, streak_days, total_points")
      .eq("user_id", userId)
      .maybeSingle();

    return res.json({
      valid: true,
      userId: user.id,
      childId: child?.id,
      user: {
        parentName: user.parent_name,
        country: user.country,
        currency: user.currency,
        language: user.language,
        subscriptionPlan: user.subscription_plan,
        subscriptionStatus: user.subscription_status,
        trialStart: user.trial_start,
      },
      child: child
        ? {
            childName: child.child_name,
            gender: child.gender,
            characterChoice: child.character_choice,
            ageGroup: child.age_group,
            languagePreference: child.language_preference,
            streak: child.streak_days,
            points: child.total_points,
          }
        : null,
    });
  } catch (err) {
    req.log.error({ err }, "validate error");
    return res.status(500).json({ error: "validation_failed" });
  }
});

// ─── Forgot / Reset PIN ──────────────────────────────────────────────────────
// Generates a random 4-digit temp PIN, stores its hash in app_settings with 30-min TTL,
// and emails it to the parent. The Adam app then calls /verify-temp-pin to check it.

router.post("/auth/reset-pin", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ error: "email required" });

    const { data: user } = await supabase
      .from("users")
      .select("id, parent_name")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    // Always respond ok to avoid email enumeration
    if (!user) return res.json({ ok: true });

    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const hash = await bcrypt.hash(pin, 8);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await supabase.from("app_settings").upsert(
      { key: `pin_reset:${email.toLowerCase().trim()}`, value: JSON.stringify({ hash, expiresAt }) },
      { onConflict: "key" }
    );

    await sendEmail({
      to: email.trim(),
      subject: "🔐 Your My Hero Parent PIN Reset",
      html: pinResetHtml({ parentName: user.parent_name ?? undefined, newPin: pin }),
    });

    req.log.info({ userId: user.id }, "PIN reset sent");
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "reset-pin error");
    return res.status(500).json({ error: "failed" });
  }
});

router.post("/auth/verify-temp-pin", async (req, res) => {
  try {
    const { email, pin } = req.body as { email?: string; pin?: string };
    if (!email || !pin) return res.status(400).json({ error: "email and pin required" });

    const key = `pin_reset:${email.toLowerCase().trim()}`;
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (!setting) return res.json({ valid: false });

    const { hash, expiresAt } = JSON.parse(setting.value) as { hash: string; expiresAt: string };

    if (new Date(expiresAt) < new Date()) {
      await supabase.from("app_settings").delete().eq("key", key);
      return res.json({ valid: false, reason: "expired" });
    }

    const valid = await bcrypt.compare(pin, hash);
    if (valid) {
      // Consume the token
      await supabase.from("app_settings").delete().eq("key", key);
    }
    return res.json({ valid });
  } catch (err) {
    req.log.error({ err }, "verify-temp-pin error");
    return res.status(500).json({ error: "failed" });
  }
});

export default router;
