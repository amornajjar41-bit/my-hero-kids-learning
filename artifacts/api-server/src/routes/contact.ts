/**
 * Contact Us — POST /api/contact
 * Receives a parent's contact form submission, emails it to support@myheroapp.org,
 * and sends a confirmation email to the parent.
 */
import { Router, type IRouter } from "express";
import { sendEmail, contactConfirmHtml } from "../lib/email.js";

const router: IRouter = Router();

const SUPPORT_EMAIL = process.env["SUPPORT_EMAIL"] ?? "support@myheroapp.org";

router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (!email || !subject || !message) {
      return res.status(400).json({ error: "email, subject, and message are required" });
    }

    const safeEmail = email.trim().toLowerCase();
    const safeName = (name ?? "").trim() || safeEmail;

    // Forward to support inbox
    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[My Hero Support] ${subject} — from ${safeName}`,
      replyTo: safeEmail,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:24px;border-radius:12px">
          <h2 style="color:#7C3AED;margin-top:0">📩 New Support Request</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:18px">
            <tr><td style="padding:8px 0;color:#6B7280;font-weight:600;width:100px">From</td><td style="padding:8px 0;color:#1F2937">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#6B7280;font-weight:600">Email</td><td style="padding:8px 0"><a href="mailto:${safeEmail}" style="color:#7C3AED">${safeEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6B7280;font-weight:600">Subject</td><td style="padding:8px 0;color:#1F2937">${subject}</td></tr>
          </table>
          <div style="background:#F5F3FF;border-radius:10px;padding:16px;margin-bottom:16px">
            <p style="font-weight:700;color:#5B21B6;margin:0 0 8px">Message</p>
            <p style="color:#374151;margin:0;white-space:pre-wrap;line-height:1.6">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="color:#9CA3AF;font-size:12px">Sent: ${new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}</p>
        </div>`,
    });

    // Send confirmation to parent
    await sendEmail({
      to: safeEmail,
      subject: `We got your message 💙 — My Hero Support`,
      html: contactConfirmHtml({ parentName: safeName, subject }),
    });

    req.log.info({ from: safeEmail, subject }, "contact form submitted");
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "contact error");
    return res.status(500).json({ error: "failed" });
  }
});

export default router;
