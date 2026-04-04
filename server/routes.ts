import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { parseLinkedInData } from "./parser";
import { computeFeatures, computeScore, generateRecommendations, computePercentile } from "./scoring";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function linkAuthIdentity(req: any): void {
  try {
    const claims = req.user?.claims;
    if (!claims?.sub) return;
    storage.upsertAuthIdentity(
      claims.sub,
      "replit",
      claims.sub,
      claims.email ?? undefined
    ).catch(() => {});
  } catch {
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/tracks", isAuthenticated, async (req: any, res) => {
    linkAuthIdentity(req);
    try {
      const tracks = await storage.getCareerTracks();
      res.json(tracks);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch tracks" });
    }
  });

  app.post("/api/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileName = file.originalname.toLowerCase();
      if (!fileName.endsWith(".zip") && !fileName.endsWith(".csv")) {
        return res.status(400).json({ message: "Please upload a .zip or .csv file" });
      }

      await storage.clearUserData(userId);

      const parsed = parseLinkedInData(file.buffer, fileName, userId);

      await Promise.all([
        storage.insertPositions(parsed.positions),
        storage.insertEducation(parsed.education),
        storage.insertSkills(parsed.skills),
        storage.insertConnections(parsed.connections),
      ]);

      const [posResult, eduResult, skillResult, connResult, companyScoreList, schoolScoreList] =
        await Promise.all([
          storage.getPositionsByUser(userId),
          storage.getEducationByUser(userId),
          storage.getSkillsByUser(userId),
          storage.getConnectionsByUser(userId),
          storage.getCompanyScores(),
          storage.getSchoolScores(),
        ]);

      const profileConfig = await storage.getUserProfileConfig(userId);
      const overrides = profileConfig?.overrides;

      const features = computeFeatures(
        posResult, eduResult, skillResult, connResult,
        companyScoreList, schoolScoreList, overrides
      );

      await storage.upsertComputedFeatures(features);

      res.json({
        message: "Upload successful",
        summary: {
          positions: parsed.positions.length,
          education: parsed.education.length,
          skills: parsed.skills.length,
          connections: parsed.connections.length,
        },
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ message: error.message || "Failed to process upload" });
    }
  });

  app.post("/api/score", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { track } = req.body;

      if (!track || typeof track !== "string") {
        return res.status(400).json({ message: "Invalid track" });
      }

      const careerTrack = await storage.getCareerTrackBySlug(track);
      if (!careerTrack || !careerTrack.isActive) {
        return res.status(400).json({ message: "Invalid track" });
      }

      const weights = await storage.getTrackWeightsBySlug(track);
      if (!weights) {
        return res.status(400).json({ message: "No weights configured for this track" });
      }

      const features = await storage.getComputedFeatures(userId);
      if (!features) {
        return res.status(400).json({ message: "Please upload your LinkedIn data first" });
      }

      const { totalScore, breakdown } = computeScore(features, weights);
      const recommendations = generateRecommendations(breakdown, weights);

      const allTrackScores = await storage.getScoresByTrack(track);
      const allScoreValues = allTrackScores.map((s) => s.totalScore);
      allScoreValues.push(totalScore);
      const percentile = computePercentile(totalScore, allScoreValues);

      const score = await storage.upsertScore({
        userId,
        track,
        totalScore,
        percentile,
        factorBreakdown: breakdown,
        recommendations,
      });

      const latestHistory = await storage.getLatestScoreHistoryEntry(userId, track);
      const scoreDelta = Math.abs((latestHistory?.score ?? -1) - totalScore);
      const percentileDelta = Math.abs((latestHistory?.percentile ?? -1) - percentile);

      if (!latestHistory || scoreDelta > 0.01 || percentileDelta > 0.5) {
        await storage.insertScoreHistory({
          userId,
          track,
          score: totalScore,
          percentile,
          factorBreakdown: breakdown,
        });
      }

      const otherScores = await storage.getScoresByTrack(track);
      for (const s of otherScores) {
        if (s.userId === userId) continue;
        const allValues = otherScores.map((x) => x.totalScore);
        const newPercentile = computePercentile(s.totalScore, allValues);
        if (Math.abs(newPercentile - (s.percentile || 0)) > 0.5) {
          await storage.upsertScore({
            userId: s.userId,
            track: s.track,
            totalScore: s.totalScore,
            percentile: newPercentile,
            factorBreakdown: s.factorBreakdown as Record<string, number>,
            recommendations: s.recommendations as string[],
          });
        }
      }

      res.json(score);
    } catch (error: any) {
      console.error("Score error:", error);
      res.status(500).json({ message: error.message || "Failed to compute score" });
    }
  });

  app.get("/api/score", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const score = await storage.getLatestScore(userId);
      if (!score) {
        return res.status(404).json({ message: "No score found" });
      }
      res.json(score);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch score" });
    }
  });

  app.get("/api/score-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const track = req.query.track as string;

      if (!track) {
        return res.status(400).json({ message: "track query parameter required" });
      }

      const careerTrack = await storage.getCareerTrackBySlug(track);
      if (!careerTrack) {
        return res.status(400).json({ message: "Invalid track" });
      }

      const history = await storage.getScoreHistory(userId, track);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch score history" });
    }
  });

  app.get("/api/features", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const features = await storage.getComputedFeatures(userId);
      if (!features) {
        return res.status(404).json({ message: "No features computed yet" });
      }
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch features" });
    }
  });

  app.get("/api/leaderboard/:track", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { track } = req.params;

      const careerTrack = await storage.getCareerTrackBySlug(track);
      if (!careerTrack) {
        return res.status(400).json({ message: "Invalid track" });
      }

      const allScores = await storage.getScoresByTrack(track);

      const leaderboard = allScores.map((s, index) => ({
        rank: index + 1,
        totalScore: s.totalScore,
        percentile: s.percentile || 0,
        isCurrentUser: s.userId === userId,
      }));

      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/profile-config", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserProfileConfig(userId);
      res.json(config?.overrides ?? {});
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch profile config" });
    }
  });

  app.put("/api/profile-config", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const overrides = req.body;
      const config = await storage.upsertUserProfileConfig(userId, overrides);
      res.json(config.overrides);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update profile config" });
    }
  });

  return httpServer;
}
