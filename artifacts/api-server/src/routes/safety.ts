import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";

const router: IRouter = Router();

// Keywords that immediately flag content without GPT (speed + cost)
const SAFETY_KEYWORDS_EN = [
  "sex", "sexual", "naked", "nude", "porn", "rape", "molest", "abuse",
  "kill myself", "suicide", "self harm", "cut myself", "want to die",
  "hurt me", "someone hurts", "touching me", "touched me", "private parts",
  "run away", "no one loves", "hate myself", "being bullied", "hit me",
  "beats me", "scared of", "help me please", "i am in danger",
];
const SAFETY_KEYWORDS_AR = [
  "جنس", "عاري", "بورن", "اغتصاب", "أذية", "أقتل نفسي", "انتحار",
  "أجرح نفسي", "أريد أن أموت", "يؤذيني", "يضربني", "خائف", "مساعدة",
  "في خطر", "يلمسني", "لا أحد يحبني",
];

function quickSafetyCheck(text: string): { flagged: boolean; type: string } {
  const lower = text.toLowerCase();
  for (const kw of SAFETY_KEYWORDS_EN) {
    if (lower.includes(kw)) return { flagged: true, type: "safety_keyword" };
  }
  for (const kw of SAFETY_KEYWORDS_AR) {
    if (text.includes(kw)) return { flagged: true, type: "safety_keyword" };
  }
  return { flagged: false, type: "" };
}

// Stored alerts (in-memory for this session; prod would use DB)
const alertLog: Array<{
  ts: string;
  childName: string;
  parentEmail: string;
  message: string;
  alertType: string;
}> = [];

router.post("/safety-alert", async (req, res) => {
  try {
    const { childName, parentEmail, message, alertType } = req.body as {
      childName: string;
      parentEmail: string;
      message: string;
      alertType: string;
    };

    const alert = {
      ts: new Date().toISOString(),
      childName: childName ?? "child",
      parentEmail: parentEmail ?? "",
      message: message ?? "",
      alertType: alertType ?? "unknown",
    };

    alertLog.push(alert);
    req.log.warn({ alert }, "Safety alert received");

    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "safety-alert error");
    res.status(500).json({ error: "failed" });
  }
});

// Expose alerts for parent dashboard
router.get("/safety-alerts", (_req, res) => {
  res.json({ alerts: alertLog.slice(-50) });
});

// Export the keyword checker for use in chat route
export { quickSafetyCheck };
export default router;
