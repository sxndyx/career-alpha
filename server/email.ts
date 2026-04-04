import { Resend } from "resend";

let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export interface ScoreUpdateEmail {
  to: string;
  displayName?: string | null;
  track: string;
  currentScore: number;
  previousScore: number;
  currentPercentile: number;
  previousPercentile: number;
  recommendations: string[];
}

export async function sendScoreUpdateEmail(data: ScoreUpdateEmail): Promise<void> {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set — skipping email to ${data.to}`);
    return;
  }

  const scoreDelta = Math.round((data.currentScore - data.previousScore) * 10) / 10;
  const percentileDelta = Math.round((data.currentPercentile - data.previousPercentile) * 10) / 10;
  const scoreDeltaStr = scoreDelta >= 0 ? `+${scoreDelta}` : `${scoreDelta}`;
  const percentileDeltaStr = percentileDelta >= 0 ? `+${percentileDelta}` : `${percentileDelta}`;
  const name = data.displayName || "there";
  const top = Math.max(1, Math.round(100 - data.currentPercentile));

  const recs = data.recommendations
    .slice(0, 2)
    .map((r, i) => `<li style="margin-bottom:8px;">${i + 1}. ${r}</li>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Courier New', monospace; background: #fafafa; color: #111; padding: 40px; max-width: 600px; margin: 0 auto;">
  <div style="margin-bottom: 32px;">
    <span style="font-size: 16px; font-weight: bold; letter-spacing: 2px;">career<span style="color: #888;">alpha</span></span>
  </div>
  <p style="font-size: 13px; color: #555; margin-bottom: 24px;">hi ${name} — your daily score update</p>
  <div style="border: 1px solid #e0e0e0; padding: 24px; border-radius: 4px; margin-bottom: 24px;">
    <div style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">${data.track} track</div>
    <div style="font-size: 48px; font-weight: bold; letter-spacing: -1px; margin-bottom: 4px;">${data.currentScore.toFixed(1)}</div>
    <div style="font-size: 13px; color: #555;">${scoreDeltaStr} pts · top ${top}% (${percentileDeltaStr} percentile)</div>
  </div>
  ${recs ? `<div style="margin-bottom: 24px;">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 12px;">recommendations</div>
    <ul style="font-size: 12px; color: #555; padding-left: 0; list-style: none;">${recs}</ul>
  </div>` : ""}
  <p style="font-size: 11px; color: #aaa; border-top: 1px solid #e0e0e0; padding-top: 16px; margin-top: 32px;">
    you are receiving this because daily updates are enabled. visit careeral pha to manage your settings.
  </p>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: "CareerAlpha <updates@careeral pha.app>",
      to: data.to,
      subject: `your career alpha score: ${data.currentScore.toFixed(1)} (${scoreDeltaStr})`,
      html,
    });
    console.log(`[email] sent score update to ${data.to}`);
  } catch (err) {
    console.error(`[email] failed to send to ${data.to}:`, err);
  }
}
