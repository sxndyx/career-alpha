export * from "./models/auth";

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title"),
  company: text("company"),
  location: text("location"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  description: text("description"),
});

export const education = pgTable("education", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  institution: text("institution"),
  degree: text("degree"),
  fieldOfStudy: text("field_of_study"),
  startDate: text("start_date"),
  endDate: text("end_date"),
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
});

export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name"),
  connectedOn: text("connected_on"),
});

export const computedFeatures = pgTable("computed_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  internshipCount: integer("internship_count").default(0),
  totalRoles: integer("total_roles").default(0),
  brandScore: real("brand_score").default(0),
  educationTierScore: real("education_tier_score").default(0),
  skillDensity: real("skill_density").default(0),
  seniorityProgressionScore: real("seniority_progression_score").default(0),
  networkSize: integer("network_size").default(0),
  recencyScore: real("recency_score").default(0),
  consistencyScore: real("consistency_score").default(0),
  computedAt: timestamp("computed_at").defaultNow(),
});

export const scores = pgTable("scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  track: text("track").notNull(),
  totalScore: real("total_score").notNull(),
  percentile: real("percentile").default(0),
  factorBreakdown: jsonb("factor_breakdown").$type<Record<string, number>>(),
  recommendations: jsonb("recommendations").$type<string[]>(),
  computedAt: timestamp("computed_at").defaultNow(),
});

export const trackWeights = pgTable("track_weights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  track: text("track").notNull().unique(),
  weights: jsonb("weights").$type<Record<string, number>>().notNull(),
});

export const insertPositionSchema = createInsertSchema(positions).omit({ id: true });
export const insertEducationSchema = createInsertSchema(education).omit({ id: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertConnectionSchema = createInsertSchema(connections).omit({ id: true });
export const insertComputedFeaturesSchema = createInsertSchema(computedFeatures).omit({ id: true, computedAt: true });
export const insertScoreSchema = createInsertSchema(scores).omit({ id: true, computedAt: true });

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type InsertComputedFeatures = z.infer<typeof insertComputedFeaturesSchema>;
export type InsertScore = z.infer<typeof insertScoreSchema>;

export type Position = typeof positions.$inferSelect;
export type Education = typeof education.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Connection = typeof connections.$inferSelect;
export type ComputedFeatures = typeof computedFeatures.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type TrackWeight = typeof trackWeights.$inferSelect;

export const TRACKS = ["swe", "finance", "asset_management"] as const;
export type Track = typeof TRACKS[number];

export const TRACK_LABELS: Record<Track, string> = {
  swe: "Software Engineering",
  finance: "Investment Banking / Corporate Finance",
  asset_management: "Asset Management",
};
