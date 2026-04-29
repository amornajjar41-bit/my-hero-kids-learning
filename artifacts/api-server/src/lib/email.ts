/**
 * Centralized email utility using Resend API.
 * Sender: "My Hero App <support@myheroapp.org>"
 */

const SUPPORT_EMAIL = process.env["SUPPORT_EMAIL"] ?? "support@myheroapp.org";
const RESEND_KEY = process.env["RESEND_API_KEY"];
const FROM = `My Hero App <${SUPPORT_EMAIL}>`;

// Explicit fetch response shape — avoids express.Response vs globalThis.Response conflict
interface FetchResponse {
  readonly ok: boolean;
  readonly status: number;
  text(): Promise<string>;
}

interface EmailOpts {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(opts: EmailOpts): Promise<boolean> {
  if (!RESEND_KEY) {
    console.warn("[email] RESEND_API_KEY not set — email not sent to:", opts.to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    }) as unknown as FetchResponse;
    if (!res.ok) {
      console.error("[email] Resend error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

const footerHtml = `
  <div style="background:#F9FAFB;padding:16px 32px;text-align:center;border-top:1px solid #E5E7EB">
    <p style="color:#9CA3AF;font-size:12px;margin:0">
      My Hero App &middot; <a href="mailto:${SUPPORT_EMAIL}" style="color:#9CA3AF">${SUPPORT_EMAIL}</a> &middot; &copy; ${new Date().getFullYear()}
    </p>
  </div>`;

const wrapHtml = (headerColor: string, emoji: string, title: string, subtitle: string, body: string) => `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:${headerColor};padding:28px 32px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">${emoji}</div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">${title}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px">${subtitle}</p>
    </div>
    <div style="padding:32px">${body}</div>
    ${footerHtml}
  </div>`;

export function safetyAlertHtml(opts: {
  childName: string;
  alertType: string;
  timestamp: string;
}): string {
  const time = new Date(opts.timestamp).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
  return wrapHtml(
    "linear-gradient(135deg,#EF4444,#DC2626)", "⚠️", "Safety Alert", "My Hero Kids Learning",
    `<p style="font-size:16px;color:#1F2937;margin-top:0">Hello,</p>
     <p style="font-size:15px;color:#374151;line-height:1.6">
       My Hero detected a message from <strong>${opts.childName}</strong> that may need your attention.
     </p>
     <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:16px;margin:20px 0">
       <p style="margin:0 0 6px;font-weight:700;color:#991B1B;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Category of concern</p>
       <p style="margin:0;color:#7F1D1D;font-size:15px;font-weight:600">${opts.alertType.replace(/_/g, " ")}</p>
     </div>
     <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:14px 18px;margin:16px 0">
       <p style="margin:0;color:#166534;font-size:14px">
         ✅ My Hero has automatically redirected ${opts.childName}'s conversation to a safe, educational topic.
       </p>
     </div>
     <p style="font-size:13px;color:#6B7280"><strong>Time:</strong> ${time}</p>
     <p style="font-size:14px;color:#374151;line-height:1.6">
       We recommend checking in with ${opts.childName} and reviewing the conversation in your parent dashboard.
     </p>
     <div style="text-align:center;margin-top:24px">
       <a href="https://myheroapp.org" style="background:#7C3AED;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">
         Open Parent Dashboard
       </a>
     </div>`
  );
}

export function weeklyReportHtml(opts: {
  childName: string;
  parentName: string;
  streak: number;
  wordsLearned: number;
  lessonsCompleted: number;
  storiesListened: number;
  topTopics: string[];
  homeworkSolved: number;
  badgesEarned: number;
  safetyOk: boolean;
  safetyNote?: string;
}): string {
  const { childName, parentName, streak, wordsLearned, lessonsCompleted,
    storiesListened, topTopics, homeworkSolved, badgesEarned, safetyOk, safetyNote } = opts;

  const stat = (emoji: string, value: string | number, label: string) =>
    `<div style="flex:1;background:#F9FAFB;border-radius:12px;padding:16px 10px;text-align:center;min-width:90px;margin:4px">
       <div style="font-size:26px">${emoji}</div>
       <div style="font-size:22px;font-weight:800;color:#1F2937;margin:4px 0">${value}</div>
       <div style="font-size:11px;color:#6B7280;font-weight:600">${label}</div>
     </div>`;

  const streakBlock = streak > 0
    ? `<div style="background:linear-gradient(90deg,#FEF3C7,#FDE68A);border-radius:14px;padding:14px 18px;margin:16px 0;display:flex;align-items:center;gap:14px">
         <span style="font-size:32px">🔥</span>
         <div>
           <p style="margin:0;font-weight:800;font-size:17px;color:#92400E">${streak}-day streak!</p>
           <p style="margin:4px 0 0;font-size:12px;color:#B45309">Consistency is the key to learning</p>
         </div>
       </div>` : "";

  const badgeBlock = badgesEarned > 0
    ? `<div style="background:#EDE9FE;border-radius:12px;padding:12px 16px;margin:12px 0">
         <p style="margin:0;color:#5B21B6;font-weight:700">🏆 ${badgesEarned} new badge${badgesEarned !== 1 ? "s" : ""} earned this week!</p>
       </div>` : "";

  const topicsBlock = topTopics.length > 0
    ? `<div style="margin:18px 0">
         <p style="font-weight:700;color:#1F2937;margin-bottom:8px;font-size:14px">🔍 Most explored topics</p>
         ${topTopics.map((topic, i) =>
           `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F3F4F6">
              <span style="background:#7C3AED;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;line-height:22px;font-size:12px;font-weight:800;flex-shrink:0">${i + 1}</span>
              <span style="color:#374151;font-size:14px">${topic}</span>
            </div>`
         ).join("")}
       </div>` : "";

  const safetyBlock = `
    <div style="background:${safetyOk ? "#F0FDF4" : "#FEF2F2"};border:1px solid ${safetyOk ? "#BBF7D0" : "#FECACA"};border-radius:12px;padding:14px 18px;margin:18px 0">
      <p style="margin:0;color:${safetyOk ? "#166534" : "#991B1B"};font-weight:700;font-size:14px">
        ${safetyOk ? "✅ No safety concerns this week" : `⚠️ ${safetyNote ?? "Safety alert detected — check your dashboard"}`}
      </p>
    </div>`;

  return wrapHtml(
    "linear-gradient(135deg,#7C3AED,#4F46E5)", "🦸", `${childName}'s Weekly Report`, "My Hero Learning Summary",
    `<p style="font-size:16px;color:#1F2937;margin-top:0">Hi ${parentName || "there"},</p>
     <p style="font-size:15px;color:#374151;line-height:1.6">Here's what <strong>${childName}</strong> accomplished this week! 🎉</p>
     ${streakBlock}
     <div style="display:flex;gap:8px;margin:16px 0;flex-wrap:wrap">
       ${stat("📚", lessonsCompleted, "Lessons")}
       ${stat("⭐", wordsLearned, "Words")}
       ${stat("🌙", storiesListened, "Stories")}
       ${stat("🧮", homeworkSolved, "Problems")}
     </div>
     ${badgeBlock}
     ${topicsBlock}
     ${safetyBlock}
     <div style="text-align:center;margin-top:24px">
       <a href="https://myheroapp.org" style="background:#7C3AED;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">
         View Full Dashboard
       </a>
     </div>
     <p style="font-size:12px;color:#9CA3AF;margin-top:20px;text-align:center">
       You receive this every Sunday because you're a My Hero parent.
     </p>`
  );
}

export function contactConfirmHtml(opts: { parentName: string; subject: string }): string {
  return wrapHtml(
    "linear-gradient(135deg,#7C3AED,#4F46E5)", "💙", "Message Received", "My Hero Support",
    `<p style="font-size:16px;color:#1F2937;margin-top:0">Hi ${opts.parentName || "there"},</p>
     <p style="font-size:15px;color:#374151;line-height:1.6">
       Thank you! We've received your message about <strong>"${opts.subject}"</strong>.
     </p>
     <p style="font-size:15px;color:#374151;line-height:1.6">
       Our team will get back to you within 24 hours 💙
     </p>
     <div style="background:#F5F3FF;border-radius:12px;padding:14px 18px;margin:18px 0;text-align:center">
       <p style="margin:0;color:#5B21B6;font-size:14px">
         📧 You can also reach us directly at
         <a href="mailto:${SUPPORT_EMAIL}" style="color:#7C3AED;font-weight:700">${SUPPORT_EMAIL}</a>
       </p>
     </div>`
  );
}

export function pinResetHtml(opts: { parentName?: string; newPin: string }): string {
  return wrapHtml(
    "linear-gradient(135deg,#7C3AED,#4F46E5)", "🔐", "PIN Reset", "My Hero Parent Dashboard",
    `<p style="font-size:16px;color:#1F2937;margin-top:0">Hi ${opts.parentName || "there"},</p>
     <p style="font-size:15px;color:#374151;line-height:1.6">
       You requested a PIN reset for your My Hero parent dashboard. Your new temporary PIN is:
     </p>
     <div style="background:#F5F3FF;border:2px solid #7C3AED;border-radius:16px;padding:24px;text-align:center;margin:24px 0">
       <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:18px;color:#5B21B6">${opts.newPin}</p>
     </div>
     <p style="font-size:14px;color:#6B7280;line-height:1.6">
       Open the My Hero app, enter this PIN on the parent dashboard screen, then set a new one of your choice.
       This PIN expires in 30 minutes.
     </p>
     <p style="font-size:13px;color:#9CA3AF">If you didn't request this, you can ignore this email safely.</p>`
  );
}
