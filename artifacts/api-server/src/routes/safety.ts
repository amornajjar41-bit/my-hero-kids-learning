/**
 * Safety monitoring: keyword detection + Supabase storage + email alerts.
 * 5A – Parent email alerts for flagged content.
 */
import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

// Comprehensive safety keywords
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

// Educational safe terms — never flag these even if keywords overlap
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

  // Check educational context first — never flag
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

// Send email via Resend (configure RESEND_API_KEY to enable)
async function sendSafetyEmail(opts: {
  parentEmail: string;
  childName: string;
  message: string;
  alertType: string;
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn(`[safety] No RESEND_API_KEY — alert logged only. Parent: ${opts.parentEmail}, child: ${opts.childName}`);
    return;
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "My Hero Safety <alerts@myheroapp.com>",
        to: [opts.parentEmail],
        subject: `My Hero Safety Alert — ${opts.childName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#EF4444;color:white;padding:20px;border-radius:12px 12px 0 0">
              <h2 style="margin:0">🚨 Safety Alert — My Hero App</h2>
            </div>
            <div style="background:#FEF2F2;padding:20px;border:1px solid #FCA5A5;border-top:none;border-radius:0 0 12px 12px">
              <p><strong>Child:</strong> ${opts.childName}</p>
              <p><strong>Alert type:</strong> ${opts.alertType}</p>
              <p><strong>Flagged message:</strong></p>
              <blockquote style="border-left:4px solid #EF4444;padding-left:12px;color:#7F1D1D;margin:8px 0;font-style:italic">
                "${opts.message.slice(0, 300)}${opts.message.length > 300 ? "…" : ""}"
              </blockquote>
              <p style="color:#6B7280;font-size:13px">
                My Hero has automatically redirected the conversation to a safe learning topic.
                Please check in with your child.
              </p>
              <hr style="border:none;border-top:1px solid #FCA5A5">
              <p style="color:#9CA3AF;font-size:11px">My Hero — Safe Learning for Kids</p>
            </div>
          </div>`,
      }),
    });
    if (!resp.ok) console.error("[safety] Resend error:", await resp.text());
  } catch (err) {
    console.error("[safety] Email send failed:", err);
  }
}

router.post("/safety-alert", async (req, res) => {
  try {
    const { childName, parentEmail, message, alertType, childId } = req.body as {
      childName: string;
      parentEmail: string;
      message: string;
      alertType: string;
      childId?: string;
    };

    const severity = (alertType === "safety_keyword") ? "high" : "medium";

    // Store in Supabase safety_alerts table
    try {
      if (childId) {
        await supabase.from("safety_alerts").insert({
          child_id: childId,
          timestamp: new Date().toISOString(),
          category: alertType ?? "unknown",
          severity,
          alert_sent: true,
        });
      }
    } catch {
      // Non-fatal — Supabase might not have the table yet
    }

    // Send parent email
    await sendSafetyEmail({
      parentEmail: parentEmail ?? "",
      childName: childName ?? "child",
      message: message ?? "",
      alertType: alertType ?? "unknown",
    });

    req.log.warn({ childName, alertType, severity }, "Safety alert processed");
    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "safety-alert error");
    res.status(500).json({ error: "failed" });
  }
});

router.get("/safety-alerts", (_req, res) => {
  // Client-side AsyncStorage is primary source; this is a stub
  res.json({ alerts: [] });
});

export default router;
