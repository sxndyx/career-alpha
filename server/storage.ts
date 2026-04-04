import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  positions, education, skills, connections, computedFeatures, scores,
  trackWeights, careerTracks, scoreHistory, userProfileConfig,
  companyScores, schoolScores, authIdentities,
  type InsertPosition, type InsertEducation, type InsertSkill, type InsertConnection,
  type InsertComputedFeatures, type InsertScore, type InsertCareerTrack,
  type InsertScoreHistory, type InsertUserProfileConfig, type ProfileOverrides,
  type Position, type Education, type Skill, type Connection, type ComputedFeatures,
  type Score, type CareerTrack, type TrackWeight, type ScoreHistory,
  type UserProfileConfig, type CompanyScore, type SchoolScore, type AuthIdentity,
} from "@shared/schema";
import { users, type User } from "@shared/models/auth";

export interface IStorage {
  getUserSettings(userId: string): Promise<User | undefined>;
  updateUserSettings(userId: string, settings: { displayName?: string | null; showOnLeaderboard?: boolean; dailyUpdatesEnabled?: boolean }): Promise<User>;
  getLeaderboardByTrack(track: string, currentUserId: string): Promise<Array<{ rank: number; totalScore: number; percentile: number; isCurrentUser: boolean; name: string }>>;
  insertPositions(data: InsertPosition[]): Promise<Position[]>;
  insertEducation(data: InsertEducation[]): Promise<Education[]>;
  insertSkills(data: InsertSkill[]): Promise<Skill[]>;
  insertConnections(data: InsertConnection[]): Promise<Connection[]>;
  getPositionsByUser(userId: string): Promise<Position[]>;
  getEducationByUser(userId: string): Promise<Education[]>;
  getSkillsByUser(userId: string): Promise<Skill[]>;
  getConnectionsByUser(userId: string): Promise<Connection[]>;
  upsertComputedFeatures(data: InsertComputedFeatures): Promise<ComputedFeatures>;
  getComputedFeatures(userId: string): Promise<ComputedFeatures | undefined>;
  upsertScore(data: InsertScore): Promise<Score>;
  getLatestScore(userId: string): Promise<Score | undefined>;
  getScoresByTrack(track: string): Promise<Score[]>;
  clearUserData(userId: string): Promise<void>;
  getCareerTracks(): Promise<CareerTrack[]>;
  getCareerTrackBySlug(slug: string): Promise<CareerTrack | undefined>;
  upsertCareerTrack(data: InsertCareerTrack): Promise<CareerTrack>;
  getTrackWeightsBySlug(slug: string): Promise<Record<string, number> | undefined>;
  upsertTrackWeights(trackId: string, weights: Record<string, number>): Promise<void>;
  insertScoreHistory(data: InsertScoreHistory): Promise<ScoreHistory>;
  getScoreHistory(userId: string, track: string): Promise<ScoreHistory[]>;
  getLatestScoreHistoryEntry(userId: string, track: string): Promise<ScoreHistory | undefined>;
  getUserProfileConfig(userId: string): Promise<UserProfileConfig | undefined>;
  upsertUserProfileConfig(userId: string, overrides: ProfileOverrides): Promise<UserProfileConfig>;
  getCompanyScores(): Promise<CompanyScore[]>;
  getSchoolScores(): Promise<SchoolScore[]>;
  upsertCompanyScore(nameKey: string, score: number): Promise<void>;
  upsertSchoolScore(nameKey: string, score: number): Promise<void>;
  upsertAuthIdentity(userId: string, provider: string, providerUserId: string, email?: string): Promise<AuthIdentity>;
  getAuthIdentity(provider: string, providerUserId: string): Promise<AuthIdentity | undefined>;
}

class DatabaseStorage implements IStorage {
  async insertPositions(data: InsertPosition[]): Promise<Position[]> {
    if (data.length === 0) return [];
    return db.insert(positions).values(data).returning();
  }

  async insertEducation(data: InsertEducation[]): Promise<Education[]> {
    if (data.length === 0) return [];
    return db.insert(education).values(data).returning();
  }

  async insertSkills(data: InsertSkill[]): Promise<Skill[]> {
    if (data.length === 0) return [];
    return db.insert(skills).values(data).returning();
  }

  async insertConnections(data: InsertConnection[]): Promise<Connection[]> {
    if (data.length === 0) return [];
    return db.insert(connections).values(data).returning();
  }

  async getPositionsByUser(userId: string): Promise<Position[]> {
    return db.select().from(positions).where(eq(positions.userId, userId));
  }

  async getEducationByUser(userId: string): Promise<Education[]> {
    return db.select().from(education).where(eq(education.userId, userId));
  }

  async getSkillsByUser(userId: string): Promise<Skill[]> {
    return db.select().from(skills).where(eq(skills.userId, userId));
  }

  async getConnectionsByUser(userId: string): Promise<Connection[]> {
    return db.select().from(connections).where(eq(connections.userId, userId));
  }

  async upsertComputedFeatures(data: InsertComputedFeatures): Promise<ComputedFeatures> {
    const [result] = await db
      .insert(computedFeatures)
      .values(data)
      .onConflictDoUpdate({
        target: computedFeatures.userId,
        set: { ...data, computedAt: new Date() },
      })
      .returning();
    return result;
  }

  async getComputedFeatures(userId: string): Promise<ComputedFeatures | undefined> {
    const [result] = await db
      .select()
      .from(computedFeatures)
      .where(eq(computedFeatures.userId, userId));
    return result;
  }

  async upsertScore(data: InsertScore): Promise<Score> {
    const existing = await db
      .select()
      .from(scores)
      .where(and(eq(scores.userId, data.userId), eq(scores.track, data.track)));

    if (existing.length > 0) {
      const [result] = await db
        .update(scores)
        .set({ ...data, computedAt: new Date() })
        .where(and(eq(scores.userId, data.userId), eq(scores.track, data.track)))
        .returning();
      return result;
    }

    const [result] = await db.insert(scores).values(data).returning();
    return result;
  }

  async getLatestScore(userId: string): Promise<Score | undefined> {
    const [result] = await db
      .select()
      .from(scores)
      .where(eq(scores.userId, userId))
      .orderBy(desc(scores.computedAt))
      .limit(1);
    return result;
  }

  async getScoresByTrack(track: string): Promise<Score[]> {
    return db
      .select()
      .from(scores)
      .where(eq(scores.track, track))
      .orderBy(desc(scores.totalScore));
  }

  async clearUserData(userId: string): Promise<void> {
    await db.delete(scoreHistory).where(eq(scoreHistory.userId, userId));
    await db.delete(scores).where(eq(scores.userId, userId));
    await db.delete(computedFeatures).where(eq(computedFeatures.userId, userId));
    await db.delete(positions).where(eq(positions.userId, userId));
    await db.delete(education).where(eq(education.userId, userId));
    await db.delete(skills).where(eq(skills.userId, userId));
    await db.delete(connections).where(eq(connections.userId, userId));
  }

  async getCareerTracks(): Promise<CareerTrack[]> {
    return db
      .select()
      .from(careerTracks)
      .where(eq(careerTracks.isActive, true))
      .orderBy(careerTracks.createdAt);
  }

  async getCareerTrackBySlug(slug: string): Promise<CareerTrack | undefined> {
    const [result] = await db
      .select()
      .from(careerTracks)
      .where(eq(careerTracks.slug, slug));
    return result;
  }

  async upsertCareerTrack(data: InsertCareerTrack): Promise<CareerTrack> {
    const [result] = await db
      .insert(careerTracks)
      .values(data)
      .onConflictDoUpdate({
        target: careerTracks.slug,
        set: { name: data.name, description: data.description, isActive: data.isActive },
      })
      .returning();
    return result;
  }

  async getTrackWeightsBySlug(slug: string): Promise<Record<string, number> | undefined> {
    const track = await this.getCareerTrackBySlug(slug);
    if (!track) return undefined;
    const [tw] = await db
      .select()
      .from(trackWeights)
      .where(eq(trackWeights.trackId, track.id));
    return tw?.weights;
  }

  async upsertTrackWeights(trackId: string, weights: Record<string, number>): Promise<void> {
    await db
      .insert(trackWeights)
      .values({ trackId, weights })
      .onConflictDoUpdate({ target: trackWeights.trackId, set: { weights } });
  }

  async insertScoreHistory(data: InsertScoreHistory): Promise<ScoreHistory> {
    const [result] = await db.insert(scoreHistory).values(data).returning();
    return result;
  }

  async getScoreHistory(userId: string, track: string): Promise<ScoreHistory[]> {
    return db
      .select()
      .from(scoreHistory)
      .where(and(eq(scoreHistory.userId, userId), eq(scoreHistory.track, track)))
      .orderBy(asc(scoreHistory.createdAt));
  }

  async getLatestScoreHistoryEntry(userId: string, track: string): Promise<ScoreHistory | undefined> {
    const [result] = await db
      .select()
      .from(scoreHistory)
      .where(and(eq(scoreHistory.userId, userId), eq(scoreHistory.track, track)))
      .orderBy(desc(scoreHistory.createdAt))
      .limit(1);
    return result;
  }

  async getUserProfileConfig(userId: string): Promise<UserProfileConfig | undefined> {
    const [result] = await db
      .select()
      .from(userProfileConfig)
      .where(eq(userProfileConfig.userId, userId));
    return result;
  }

  async upsertUserProfileConfig(userId: string, overrides: ProfileOverrides): Promise<UserProfileConfig> {
    const [result] = await db
      .insert(userProfileConfig)
      .values({ userId, overrides })
      .onConflictDoUpdate({
        target: userProfileConfig.userId,
        set: { overrides, updatedAt: new Date() },
      })
      .returning();
    return result;
  }

  async getCompanyScores(): Promise<CompanyScore[]> {
    return db.select().from(companyScores);
  }

  async getSchoolScores(): Promise<SchoolScore[]> {
    return db.select().from(schoolScores);
  }

  async upsertCompanyScore(nameKey: string, score: number): Promise<void> {
    await db
      .insert(companyScores)
      .values({ nameKey, score })
      .onConflictDoUpdate({ target: companyScores.nameKey, set: { score } });
  }

  async upsertSchoolScore(nameKey: string, score: number): Promise<void> {
    await db
      .insert(schoolScores)
      .values({ nameKey, score })
      .onConflictDoUpdate({ target: schoolScores.nameKey, set: { score } });
  }

  async upsertAuthIdentity(
    userId: string,
    provider: string,
    providerUserId: string,
    email?: string
  ): Promise<AuthIdentity> {
    const existing = await db
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.providerUserId, providerUserId)
        )
      );

    if (existing.length > 0) {
      const [result] = await db
        .update(authIdentities)
        .set({ userId, email: email ?? existing[0].email })
        .where(eq(authIdentities.id, existing[0].id))
        .returning();
      return result;
    }

    const [result] = await db
      .insert(authIdentities)
      .values({ userId, provider, providerUserId, email })
      .returning();
    return result;
  }

  async getAuthIdentity(provider: string, providerUserId: string): Promise<AuthIdentity | undefined> {
    const [result] = await db
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.providerUserId, providerUserId)
        )
      );
    return result;
  }

  async getUserSettings(userId: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, userId));
    return result;
  }

  async updateUserSettings(
    userId: string,
    settings: {
      displayName?: string | null;
      showOnLeaderboard?: boolean;
      dailyUpdatesEnabled?: boolean;
    }
  ): Promise<User> {
    const [result] = await db
      .update(users)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result;
  }

  async getLeaderboardByTrack(
    track: string,
    currentUserId: string
  ): Promise<Array<{
    rank: number;
    totalScore: number;
    percentile: number;
    isCurrentUser: boolean;
    name: string;
  }>> {
    const allScores = await db
      .select()
      .from(scores)
      .where(eq(scores.track, track))
      .orderBy(desc(scores.totalScore));

    const userIds = allScores.map((s) => s.userId);
    const userMap = new Map<string, User>();

    if (userIds.length > 0) {
      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.id, userIds[0]));

      for (const u of userRows) userMap.set(u.id, u);

      for (let i = 1; i < userIds.length; i++) {
        const [u] = await db.select().from(users).where(eq(users.id, userIds[i]));
        if (u) userMap.set(u.id, u);
      }
    }

    return allScores.map((s, index) => {
      const user = userMap.get(s.userId);
      const isCurrentUser = s.userId === currentUserId;
      let name = "anonymous";
      if (isCurrentUser) {
        name = "you";
      } else if (user?.showOnLeaderboard && user.displayName) {
        name = user.displayName;
      }
      return {
        rank: index + 1,
        totalScore: s.totalScore,
        percentile: s.percentile || 0,
        isCurrentUser,
        name,
      };
    });
  }
}

export const storage = new DatabaseStorage();
