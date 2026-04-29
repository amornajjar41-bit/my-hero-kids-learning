/**
 * Safety monitoring: keyword detection + Supabase storage + instant email alerts.
 * Change 2 — instant alert email when message is flagged.
 */
import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase.js";
import { sendEmail, safetyAlertHtml } from "../lib/email.js";

const router: IRouter = Router();

const SAFETY_KEYWORDS_EN = [
  "sex", "sexual", "naked", "nude", "porn", "rape", "molest", "abuse",
  "kill myself", "suicide", "self harm", "cut myself", "want to die",
  "hurt me", "someone hurts", "touching me", "touched me", "private parts",
  "run away", "no one loves", "hate myself", "being bullied", "hit me",
  "beats me", "scared of", "help me please", "i am in danger", "in danger",
  "stranger danger", "someone followed",
];
const SAFETY_KEYWORDS_AR = [
  "جنس", "عاري", "بورن", "اغتصاب", "أذية", "أقتل نفسي", "انتحار",
  "أجرح نفسي", "أريد أن أموت", "يؤذيني", "يضربني", "خائف", "في خطر",
  "يلمسني", "لا أحد يحبني", "تحرش", "ضربني", "خايف", "شخص غريب", "يلاحقني",
];

const EDUCATION_SAFE_EN = [
  "reproductive system", "human body", "biology", "anatomy", "health class",
  "suicide prevention", "mental health awareness", "bullying awareness", "safety lesson",
  "the human body", "science class",
];
const EDUCATION_SAFE_AR = [
  "الجهاز التناسلي", "جسم الإنسان", "أحياء", "تشريح", "الصحة",
  "درس السلامة", "التوعية الصحية",
];

export function quickSafetyCheck(text: string): { flagged: boolean; type: string } {
  const lower = text.toLowerCase();
  for (const safe of EDUCATION_SAFE_EN) {
    if (lower.includes(safe)) return { flagged: false, type: "" };
  }
  for (const safe of EDUCATION_SAFE_AR) {
    if (text.includes(safe)) return { flagged: false, type: "" };
  }
  for (const kw of SAFETY_KEYWORDS_EN) {
    if (lower.includes(kw)) return { flagged: true, type: "safety_keyword" };
  }
  for (const kw of SAFETY_KEYWORDS_AR) {
    if (text.includes(kw)) return { flagged: true, type: "safety_keyword" };
  }
  return { flagged: false, type: "" };
}

router.post("/safety-alert", async (req, res) => {
  try {
    const { childName, parentEmail, message: _message, alertType, childId } = req.body as {
      childName: string;
      parentEmail: string;
      message: string;
      alertType: string;
      childId?: string;
    };

    const severity = alertType === "safety_keyword" ? "high" : "medium";
    const timestamp = new Date().toISOString();

    // Persist in Supabase
    if (childId) {
      await supabase.from("safety_alerts").insert({
        child_id: childId,
        timestamp,
        category: alertType ?? "unknown",
        severity,
        alert_sent: true,
      }).catch(() => {});
    }

    // Instant email — does NOT include the exact message text for child privacy
    if (parentEmail) {
      await sendEmail({
        to: parentEmail,
        subject: `⚠️ My Hero Safety Alert — ${childName ?? "your child"}`,
        html: safetyAlertHtml({
          childName: childName ?? "your child",
          alertType: alertType ?? "unknown",
          timestamp,
        }),
      });
    }

    req.log.warn({ childName, alertType, severity }, "Safety alert processed");
    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "safety-alert error");
    res.status(500).json({ error: "failed" });
  }
});

router.get("/safety-alerts", (_req, res) => {
  res.json({ alerts: [] });
});

export default router;
