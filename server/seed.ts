import { db } from "./db";
import { positions, education, skills, connections, computedFeatures, scores } from "@shared/schema";
import { eq } from "drizzle-orm";

const SEED_USER_IDS = ["seed_user_1", "seed_user_2", "seed_user_3", "seed_user_4", "seed_user_5"];

export async function seedDatabase() {
  const existing = await db.select().from(scores).limit(1);
  if (existing.length > 0) return;

  console.log("Seeding database with sample data...");

  const seedProfiles = [
    {
      userId: SEED_USER_IDS[0],
      positions: [
        { title: "Software Engineering Intern", company: "Google", startDate: "Jun 2024", endDate: "Aug 2024" },
        { title: "Software Engineering Intern", company: "Meta", startDate: "Jun 2023", endDate: "Aug 2023" },
        { title: "Research Assistant", company: "MIT CSAIL", startDate: "Sep 2022", endDate: "May 2023" },
      ],
      education: [
        { institution: "Massachusetts Institute of Technology", degree: "BS", fieldOfStudy: "Computer Science" },
      ],
      skills: ["Python", "Java", "C++", "Machine Learning", "React", "TypeScript", "AWS", "SQL", "Distributed Systems", "Algorithms"],
      connections: 450,
      track: "swe",
    },
    {
      userId: SEED_USER_IDS[1],
      positions: [
        { title: "Summer Analyst", company: "Goldman Sachs", startDate: "Jun 2024", endDate: "Aug 2024" },
        { title: "Investment Banking Intern", company: "Morgan Stanley", startDate: "Jun 2023", endDate: "Aug 2023" },
      ],
      education: [
        { institution: "University of Pennsylvania", degree: "BS", fieldOfStudy: "Finance" },
      ],
      skills: ["Financial Modeling", "Valuation", "Excel", "PowerPoint", "Bloomberg Terminal", "M&A"],
      connections: 380,
      track: "finance",
    },
    {
      userId: SEED_USER_IDS[2],
      positions: [
        { title: "Software Engineering Intern", company: "Stripe", startDate: "Jun 2024", endDate: "Aug 2024" },
        { title: "Teaching Assistant", company: "Stanford University", startDate: "Sep 2023", endDate: "Dec 2023" },
      ],
      education: [
        { institution: "Stanford University", degree: "BS", fieldOfStudy: "Computer Science" },
      ],
      skills: ["Python", "Go", "Kubernetes", "React", "PostgreSQL", "GraphQL", "Docker", "CI/CD"],
      connections: 290,
      track: "swe",
    },
    {
      userId: SEED_USER_IDS[3],
      positions: [
        { title: "Equity Research Intern", company: "BlackRock", startDate: "Jun 2024", endDate: "Aug 2024" },
        { title: "Analyst Intern", company: "Fidelity", startDate: "Jun 2023", endDate: "Aug 2023" },
        { title: "Investment Club President", company: "Yale University", startDate: "Sep 2022", endDate: "May 2024" },
      ],
      education: [
        { institution: "Yale University", degree: "BA", fieldOfStudy: "Economics" },
      ],
      skills: ["Equity Research", "Financial Analysis", "Bloomberg", "Python", "Excel"],
      connections: 320,
      track: "asset_management",
    },
    {
      userId: SEED_USER_IDS[4],
      positions: [
        { title: "Software Engineer Intern", company: "Amazon", startDate: "Jun 2024", endDate: "Aug 2024" },
      ],
      education: [
        { institution: "University of Michigan", degree: "BS", fieldOfStudy: "Computer Engineering" },
      ],
      skills: ["Java", "Python", "AWS", "SQL"],
      connections: 180,
      track: "swe",
    },
  ];

  for (const profile of seedProfiles) {
    await db.insert(positions).values(
      profile.positions.map((p) => ({
        userId: profile.userId,
        title: p.title,
        company: p.company,
        startDate: p.startDate,
        endDate: p.endDate,
      }))
    );

    await db.insert(education).values(
      profile.education.map((e) => ({
        userId: profile.userId,
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
      }))
    );

    await db.insert(skills).values(
      profile.skills.map((s) => ({
        userId: profile.userId,
        name: s,
      }))
    );

    const connCount = profile.connections;
    const connBatch = Array.from({ length: Math.min(connCount, 50) }, (_, i) => ({
      userId: profile.userId,
      name: `Connection ${i + 1}`,
      connectedOn: "2024",
    }));
    await db.insert(connections).values(connBatch);

    const userPositions = await db.select().from(positions).where(eq(positions.userId, profile.userId));
    const userEducation = await db.select().from(education).where(eq(education.userId, profile.userId));
    const userSkills = await db.select().from(skills).where(eq(skills.userId, profile.userId));
    const userConnections = await db.select().from(connections).where(eq(connections.userId, profile.userId));

    const { computeFeatures, computeScore, generateRecommendations, computePercentile } = await import("./scoring");
    const features = computeFeatures(userPositions, userEducation, userSkills, userConnections);
    features.networkSize = profile.connections;
    await db.insert(computedFeatures).values(features);

    const { totalScore, breakdown } = computeScore(features as any, profile.track);
    const recs = generateRecommendations(breakdown, profile.track);

    await db.insert(scores).values({
      userId: profile.userId,
      track: profile.track,
      totalScore,
      percentile: 50,
      factorBreakdown: breakdown,
      recommendations: recs,
    });
  }

  const tracks = ["swe", "finance", "asset_management"];
  for (const track of tracks) {
    const trackScores = await db.select().from(scores).where(eq(scores.track, track));
    const allValues = trackScores.map((s) => s.totalScore);
    for (const s of trackScores) {
      const { computePercentile } = await import("./scoring");
      const percentile = computePercentile(s.totalScore, allValues);
      await db.update(scores).set({ percentile }).where(eq(scores.id, s.id));
    }
  }

  console.log("Seeding complete.");
}
