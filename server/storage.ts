import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  positions, education, skills, connections, computedFeatures, scores, trackWeights, careerTracks,
  type InsertPosition, type InsertEducation, type InsertSkill, type InsertConnection,
  type InsertComputedFeatures, type InsertScore, type InsertCareerTrack,
  type Position, type Education, type Skill, type Connection, type ComputedFeatures, type Score,
  type CareerTrack, type TrackWeight,
} from "@shared/schema";

export interface IStorage {
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
    const [result] = await db.select().from(computedFeatures).where(eq(computedFeatures.userId, userId));
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
}

export const storage = new DatabaseStorage();
