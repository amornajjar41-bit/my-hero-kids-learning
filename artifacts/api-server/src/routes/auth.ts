import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { query, queryOne } from "../lib/db";

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

    // Check if user already exists
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email.toLowerCase()]
    );
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
    const userRows = await query<{ id: string }>(
      `INSERT INTO users (email, parent_name, country, currency, language, created_at, subscription_plan,
       subscription_status, trial_start, pin_hash)
       VALUES ($1, $2, $3, $4, $5, $6, 'trial', 'trial', $6, $7)
       RETURNING id`,
      [email.toLowerCase(), parentName, country, currency, language ?? "en", now, passwordHash]
    );

    const userId = userRows[0]?.id;
    if (!userId) {
      return res.status(500).json({ error: "registration_failed" });
    }

    // Create child
    const childRows = await query<{ id: string }>(
      `INSERT INTO children (user_id, child_name, gender, date_of_birth, character_choice,
       age_group, language_preference, last_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        childName,
        childGender,
        childDob ?? null,
        characterChoice ?? childGender,
        ageGroup,
        languagePreference ?? language ?? "en",
        now,
      ]
    );

    const childId = childRows[0]?.id;

    // Save session token
    await query(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [`session:${sessionToken}`, userId]
    );

    return res.json({
      sessionToken,
      userId,
      childId,
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

    const user = await queryOne<{
      id: string;
      pin_hash: string;
      subscription_plan: string;
      subscription_status: string;
      trial_start: string;
      parent_name: string;
      country: string;
      currency: string;
      language: string;
    }>(
      `SELECT id, pin_hash, subscription_plan, subscription_status, trial_start,
       parent_name, country, currency, language
       FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const valid = await bcrypt.compare(password, user.pin_hash ?? "");
    if (!valid) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const sessionToken = randomUUID();
    await query(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [`session:${sessionToken}`, user.id]
    );

    const child = await queryOne<{
      id: string;
      child_name: string;
      gender: string;
      character_choice: string;
      age_group: string;
      language_preference: string;
      streak_days: number;
      total_points: number;
    }>(
      `SELECT id, child_name, gender, character_choice, age_group,
       language_preference, streak_days, total_points
       FROM children WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );

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

    const setting = await queryOne<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = $1 LIMIT 1",
      [`session:${sessionToken}`]
    );

    if (!setting) {
      return res.status(401).json({ error: "invalid_token" });
    }

    const userId = setting.value;

    const user = await queryOne<{
      id: string;
      parent_name: string;
      country: string;
      currency: string;
      language: string;
      subscription_plan: string;
      subscription_status: string;
      trial_start: string;
    }>(
      `SELECT id, parent_name, country, currency, language,
       subscription_plan, subscription_status, trial_start
       FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (!user) {
      return res.status(401).json({ error: "user_not_found" });
    }

    const child = await queryOne<{
      id: string;
      child_name: string;
      gender: string;
      character_choice: string;
      age_group: string;
      language_preference: string;
      streak_days: number;
      total_points: number;
    }>(
      `SELECT id, child_name, gender, character_choice, age_group,
       language_preference, streak_days, total_points
       FROM children WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

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

export default router;
