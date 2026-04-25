import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Stub endpoint that "sends" a weekly parent report.
// In production this would dispatch via SendGrid / SES.
router.post("/parent/weekly-report", (req, res) => {
  const { parentEmail, childName, summary } = req.body as {
    parentEmail: string;
    childName: string;
    summary: {
      wordsLearned: number;
      questionsAsked: number;
      lessonsCompleted: number;
      activeDays: number;
      strengths: string[];
      difficulties: string[];
    };
  };
  req.log.info(
    { parentEmail, childName, summary },
    "Weekly parent report (stub send)",
  );
  res.json({ ok: true, sentTo: parentEmail });
});

export default router;
