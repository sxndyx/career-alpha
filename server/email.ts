import { Resend } from "resend";

let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const FACTOR_DISPLAY: Record<string, string> = {
  internship_count: "internships",
  brand_score: "brand",
  skill_density: "skills",
  education_tier_score: "education",
  seniority_progression_score: "seniority",
  network_size: "network",
  recency_score: "recency",
  consistency_score: "consistency",
};

export interface ScoreUpdateEmail {
  to: string;
  displayName?: string | null;
  track: string;
  trackLabel: string;
  currentScore: number;
  previousScore: number;
  currentPercentile: number;
  previousPercentile: number;
  currentRank: number;
  previousRank?: number;
  totalUsers: number;
  factorBreakdown: Record<string, number>;
  previousFactorBreakdown?: Record<string, number>;
  recommendations: string[];
}

function sign(n: number): string {
  return n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1);
}

function signInt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function td(text: string, align: "left" | "right" = "left", muted = false): string {
  const color = muted ? "#888" : "#111";
  const textAlign = align === "right" ? "text-align:right;" : "";
  return `<td style="padding:6px 0;font-size:12px;color:${color};${textAlign}font-family:'Courier New',monospace;">${text}</td>`;
}

export async function sendScoreUpdateEmail(data: ScoreUpdateEmail): Promise<void> {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set — skipping email to ${data.to}`);
    return;
  }

  const scoreDelta = data.currentScore - data.previousScore;
  const percentileDelta = data.currentPercentile - data.previousPercentile;
  const rankDelta = data.previousRank !== undefined ? data.previousRank - data.currentRank : 0;
  const topPct = Math.max(1, Math.round(100 - data.currentPercentile));
  const prevTopPct = Math.max(1, Math.round(100 - data.previousPercentile));

  const scoreDeltaStr = sign(scoreDelta);
  const percentileDeltaStr = signInt(Math.round(percentileDelta));
  const rankDeltaStr = signInt(rankDelta);

  const subject = `CareerAlpha Daily — ${scoreDeltaStr} | #${data.currentRank} ${data.trackLabel} | Top ${topPct}%`;

  const changedFactors: Array<{ label: string; delta: number; current: number; prev: number }> = [];
  if (data.previousFactorBreakdown) {
    for (const [key, current] of Object.entries(data.factorBreakdown)) {
      const prev = data.previousFactorBreakdown[key] ?? 0;
      const delta = current - prev;
      if (Math.abs(delta) >= 0.05) {
        changedFactors.push({
          label: FACTOR_DISPLAY[key] ?? key,
          delta,
          current,
          prev,
        });
      }
    }
    changedFactors.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  const action = data.recommendations[0] ?? "";

  const summaryRows = [
    `<tr>${td("score", "left", true)}${td(`${data.currentScore.toFixed(1)}`, "right")}${td(`(${scoreDeltaStr})`, "right", true)}</tr>`,
    `<tr>${td("percentile", "left", true)}${td(`${data.currentPercentile.toFixed(1)}th`, "right")}${td(`(${percentileDeltaStr})`, "right", true)}</tr>`,
    `<tr>${td("rank", "left", true)}${td(`#${data.currentRank} of ${data.totalUsers}`, "right")}${td(`(${rankDeltaStr})`, "right", true)}</tr>`,
  ].join("");

  const factorRows = changedFactors.slice(0, 4).map((f) => {
    const deltaStr = sign(f.delta);
    const color = f.delta >= 0 ? "#2a7a2a" : "#a02020";
    return `<tr>
      ${td(f.label, "left", true)}
      ${td(f.prev.toFixed(1), "right", true)}
      ${td("→", "right", true)}
      ${td(f.current.toFixed(1), "right")}
      <td style="padding:6px 0 6px 8px;font-size:12px;color:${color};font-family:'Courier New',monospace;font-weight:bold;">${deltaStr}</td>
    </tr>`;
  }).join("");

  const hr = `<div style="border-top:1px solid #e0e0e0;margin:20px 0;"></div>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;font-family:'Courier New',monospace;color:#111;background:#f9f9f9;">

  <div style="margin-bottom:28px;">
    <span style="font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;">career<span style="color:#888;">alpha</span></span>
  </div>

  <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">${data.trackLabel} · daily update</div>

  <div style="font-size:52px;font-weight:bold;letter-spacing:-2px;line-height:1;margin-bottom:6px;">${data.currentScore.toFixed(1)}</div>

  <div style="font-size:13px;color:#555;margin-bottom:4px;">
    <span style="color:${scoreDelta >= 0 ? "#2a7a2a" : "#a02020"};font-weight:bold;">${scoreDeltaStr}</span>
    pts from ${data.previousScore.toFixed(1)}
  </div>
  <div style="font-size:12px;color:#888;margin-bottom:4px;">#${data.currentRank} on leaderboard${data.previousRank && data.previousRank !== data.currentRank ? ` · was #${data.previousRank}` : ""}</div>
  <div style="font-size:12px;color:#888;">top ${topPct}%${topPct !== prevTopPct ? ` · was top ${prevTopPct}%` : ""}</div>

  ${hr}

  <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:10px;">summary</div>
  <table style="width:100%;border-collapse:collapse;">
    ${summaryRows}
  </table>

  ${changedFactors.length > 0 ? `
  ${hr}
  <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:10px;">what changed</div>
  <table style="width:100%;border-collapse:collapse;">
    ${factorRows}
  </table>
  ` : ""}

  ${action ? `
  ${hr}
  <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:8px;">action</div>
  <div style="font-size:12px;color:#444;line-height:1.6;">${action}</div>
  ` : ""}

  ${hr}

  <div style="font-size:10px;color:#bbb;line-height:1.6;">
    you are receiving this because daily updates are enabled on your careeralpha account.<br>
    manage your settings at careeralpha.
  </div>

</div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: "CareerAlpha <updates@careeralpha.app>",
      to: data.to,
      subject,
      html,
    });
    console.log(`[email] sent to ${data.to} — ${subject}`);
  } catch (err) {
    console.error(`[email] failed to send to ${data.to}:`, err);
  }
}
