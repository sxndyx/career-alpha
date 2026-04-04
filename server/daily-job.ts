import cron from "node-cron";
import { db } from "./db";
import { eq, and, isNotNull } from "drizzle-orm";
import { users } from "@shared/models/auth";
import { scores, scoreHistory, computedFeatures, careerTracks, trackWeights } from "@shared/schema";
import { computeScore, generateRecommendations, computePercentile } from "./scoring";
import { storage } from "./storage";
import { sendScoreUpdateEmail } from "./email";

async function processUserDailyUpdate(
  userId: string,
  email: string,
  displayName: string | null
): Promise<void> {
  try {
    const [latestScore] = await db
      .select()
      .from(scores)
      .where(eq(scores.userId, userId))
      .orderBy(scores.computedAt)
      .limit(1);

    if (!latestScore) return;

    const track = latestScore.track;

    const features = await storage.getComputedFeatures(userId);
    if (!features) return;

    const weights = await storage.getTrackWeightsBySlug(track);
    if (!weights) return;

    const [companyScoreList, schoolScoreList] = await Promise.all([
      storage.getCompanyScores(),
      storage.getSchoolScores(),
    ]);

    const { totalScore, breakdown } = computeScore(features, weights);

    const allTrackScores = await storage.getScoresByTrack(track);
    const allScoreValues = allTrackScores.map((s) => s.totalScore);
    allScoreValues.push(totalScore);
    const percentile = computePercentile(totalScore, allScoreValues);

    const latestHistory = await storage.getLatestScoreHistoryEntry(userId, track);
    const prevScore = latestHistory?.score ?? null;
    const prevPercentile = latestHistory?.percentile ?? null;

    const scoreDelta = prevScore !== null ? Math.abs(totalScore - prevScore) : Infinity;
    const percentileDelta = prevPercentile !== null ? Math.abs(percentile - prevPercentile) : Infinity;

    if (scoreDelta <= 0.01 && percentileDelta <= 0.5) return;

    const recommendations = generateRecommendations(breakdown, weights);

    await storage.upsertScore({
      userId,
      track,
      totalScore,
      percentile,
      factorBreakdown: breakdown,
      recommendations,
    });

    await storage.insertScoreHistory({
      userId,
      track,
      score: totalScore,
      percentile,
      factorBreakdown: breakdown,
    });

    await db
      .update(users)
      .set({ lastNotifiedAt: new Date() })
      .where(eq(users.id, userId));

    await sendScoreUpdateEmail({
      to: email,
      displayName,
      track,
      currentScore: totalScore,
      previousScore: prevScore ?? totalScore,
      currentPercentile: percentile,
      previousPercentile: prevPercentile ?? percentile,
      recommendations,
    });
  } catch (err) {
    console.error(`[daily-job] error processing user ${userId}:`, err);
  }
}

async function runDailyJob(): Promise<void> {
  console.log("[daily-job] running daily score update check...");
  try {
    const eligibleUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.dailyUpdatesEnabled, true),
          isNotNull(users.email)
        )
      );

    console.log(`[daily-job] found ${eligibleUsers.length} users with daily updates enabled`);

    for (const user of eligibleUsers) {
      if (!user.email) continue;
      await processUserDailyUpdate(user.id, user.email, user.displayName ?? null);
    }

    console.log("[daily-job] daily update complete");
  } catch (err) {
    console.error("[daily-job] failed:", err);
  }
}

export function startDailyJob(): void {
  cron.schedule("0 8 * * *", () => {
    runDailyJob();
  }, { timezone: "America/New_York" });

  console.log("[daily-job] scheduled for 8:00 AM ET daily");
}
