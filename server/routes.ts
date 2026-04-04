import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { parseLinkedInData } from "./parser";
import { computeFeatures, computeScore, generateRecommendations, computePercentile } from "./scoring";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/tracks", isAuthenticated, async (_req, res) => {
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

      const [posResult, eduResult, skillResult, connResult] = await Promise.all([
        storage.getPositionsByUser(userId),
        storage.getEducationByUser(userId),
        storage.getSkillsByUser(userId),
        storage.getConnectionsByUser(userId),
      ]);

      const features = computeFeatures(posResult, eduResult, skillResult, connResult);

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

  return httpServer;
}
