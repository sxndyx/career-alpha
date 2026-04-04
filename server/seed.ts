import { db } from "./db";
import {
  positions, education, skills, connections, computedFeatures, scores,
  careerTracks, trackWeights, companyScores, schoolScores,
} from "@shared/schema";
import { eq } from "drizzle-orm";

const SEED_USER_IDS = ["seed_user_1", "seed_user_2", "seed_user_3", "seed_user_4", "seed_user_5"];

const INITIAL_TRACKS = [
  {
    slug: "swe",
    name: "Software Engineering",
    description: "optimized for software engineering internships and technical roles. weights skill density and technical brand recognition heavily.",
    isActive: true,
    weights: {
      internship_count: 0.25,
      brand_score: 0.20,
      skill_density: 0.20,
      education_tier_score: 0.15,
      seniority_progression_score: 0.10,
      network_size: 0.10,
    },
  },
  {
    slug: "finance",
    name: "Investment Banking / Corporate Finance",
    description: "tailored for investment banking and corporate finance paths. prioritizes brand prestige and institutional consistency.",
    isActive: true,
    weights: {
      brand_score: 0.30,
      internship_count: 0.25,
      education_tier_score: 0.20,
      consistency_score: 0.15,
      network_size: 0.10,
    },
  },
  {
    slug: "asset_management",
    name: "Asset Management",
    description: "built for asset management and buy-side roles. values internship depth, brand, and recent activity.",
    isActive: true,
    weights: {
      internship_count: 0.30,
      brand_score: 0.25,
      education_tier_score: 0.20,
      recency_score: 0.15,
      network_size: 0.10,
    },
  },
];

const COMPANY_SCORES: Array<{ nameKey: string; score: number }> = [
  { nameKey: "google", score: 100 },
  { nameKey: "meta", score: 100 },
  { nameKey: "apple", score: 100 },
  { nameKey: "amazon", score: 100 },
  { nameKey: "microsoft", score: 100 },
  { nameKey: "netflix", score: 100 },
  { nameKey: "nvidia", score: 100 },
  { nameKey: "goldman sachs", score: 100 },
  { nameKey: "morgan stanley", score: 100 },
  { nameKey: "j.p. morgan", score: 100 },
  { nameKey: "jpmorgan", score: 100 },
  { nameKey: "blackrock", score: 100 },
  { nameKey: "citadel", score: 100 },
  { nameKey: "two sigma", score: 100 },
  { nameKey: "jane street", score: 100 },
  { nameKey: "de shaw", score: 100 },
  { nameKey: "bridgewater", score: 100 },
  { nameKey: "mckinsey", score: 100 },
  { nameKey: "bain", score: 100 },
  { nameKey: "boston consulting", score: 100 },
  { nameKey: "bcg", score: 100 },
  { nameKey: "stripe", score: 100 },
  { nameKey: "airbnb", score: 100 },
  { nameKey: "uber", score: 100 },
  { nameKey: "openai", score: 100 },
  { nameKey: "palantir", score: 100 },
  { nameKey: "tesla", score: 100 },
  { nameKey: "spacex", score: 100 },
  { nameKey: "databricks", score: 100 },
  { nameKey: "snowflake", score: 100 },
  { nameKey: "coinbase", score: 100 },
  { nameKey: "robinhood", score: 100 },
  { nameKey: "bloomberg", score: 100 },
  { nameKey: "barclays", score: 100 },
  { nameKey: "deutsche bank", score: 100 },
  { nameKey: "ubs", score: 100 },
  { nameKey: "credit suisse", score: 100 },
  { nameKey: "citi", score: 100 },
  { nameKey: "citigroup", score: 100 },
  { nameKey: "lazard", score: 100 },
  { nameKey: "evercore", score: 100 },
  { nameKey: "moelis", score: 100 },
  { nameKey: "centerview", score: 100 },
  { nameKey: "pjt partners", score: 100 },
  { nameKey: "kkr", score: 100 },
  { nameKey: "carlyle", score: 100 },
  { nameKey: "apollo", score: 100 },
  { nameKey: "blackstone", score: 100 },
  { nameKey: "warburg pincus", score: 100 },
  { nameKey: "fidelity", score: 100 },
  { nameKey: "vanguard", score: 100 },
  { nameKey: "t. rowe price", score: 100 },
  { nameKey: "wellington", score: 100 },
  { nameKey: "pimco", score: 100 },
  { nameKey: "salesforce", score: 60 },
  { nameKey: "adobe", score: 60 },
  { nameKey: "oracle", score: 60 },
  { nameKey: "ibm", score: 60 },
  { nameKey: "intel", score: 60 },
  { nameKey: "qualcomm", score: 60 },
  { nameKey: "cisco", score: 60 },
  { nameKey: "linkedin", score: 60 },
  { nameKey: "twitter", score: 60 },
  { nameKey: "snap", score: 60 },
  { nameKey: "pinterest", score: 60 },
  { nameKey: "spotify", score: 60 },
  { nameKey: "dropbox", score: 60 },
  { nameKey: "square", score: 60 },
  { nameKey: "block", score: 60 },
  { nameKey: "shopify", score: 60 },
  { nameKey: "atlassian", score: 60 },
  { nameKey: "vmware", score: 60 },
  { nameKey: "workday", score: 60 },
  { nameKey: "deloitte", score: 60 },
  { nameKey: "pwc", score: 60 },
  { nameKey: "kpmg", score: 60 },
  { nameKey: "ernst & young", score: 60 },
  { nameKey: "accenture", score: 60 },
  { nameKey: "rbc", score: 60 },
  { nameKey: "td bank", score: 60 },
  { nameKey: "bmo", score: 60 },
  { nameKey: "scotiabank", score: 60 },
  { nameKey: "hsbc", score: 60 },
  { nameKey: "bnp paribas", score: 60 },
  { nameKey: "wells fargo", score: 60 },
  { nameKey: "bank of america", score: 60 },
  { nameKey: "charles schwab", score: 60 },
  { nameKey: "state street", score: 60 },
  { nameKey: "invesco", score: 60 },
  { nameKey: "legg mason", score: 60 },
  { nameKey: "franklin templeton", score: 60 },
];

const SCHOOL_SCORES: Array<{ nameKey: string; score: number }> = [
  { nameKey: "harvard", score: 100 },
  { nameKey: "stanford", score: 100 },
  { nameKey: "mit", score: 100 },
  { nameKey: "princeton", score: 100 },
  { nameKey: "yale", score: 100 },
  { nameKey: "columbia", score: 100 },
  { nameKey: "university of pennsylvania", score: 100 },
  { nameKey: "upenn", score: 100 },
  { nameKey: "wharton", score: 100 },
  { nameKey: "university of chicago", score: 100 },
  { nameKey: "duke", score: 100 },
  { nameKey: "northwestern", score: 100 },
  { nameKey: "caltech", score: 100 },
  { nameKey: "dartmouth", score: 100 },
  { nameKey: "brown", score: 100 },
  { nameKey: "cornell", score: 100 },
  { nameKey: "johns hopkins", score: 100 },
  { nameKey: "london school of economics", score: 100 },
  { nameKey: "lse", score: 100 },
  { nameKey: "oxford", score: 100 },
  { nameKey: "cambridge", score: 100 },
  { nameKey: "insead", score: 100 },
  { nameKey: "london business school", score: 100 },
  { nameKey: "uc berkeley", score: 100 },
  { nameKey: "ucla", score: 100 },
  { nameKey: "carnegie mellon", score: 100 },
  { nameKey: "georgia institute of technology", score: 100 },
  { nameKey: "georgia tech", score: 100 },
  { nameKey: "university of michigan", score: 100 },
  { nameKey: "nyu", score: 100 },
  { nameKey: "new york university", score: 100 },
  { nameKey: "university of virginia", score: 60 },
  { nameKey: "university of texas", score: 60 },
  { nameKey: "university of illinois", score: 60 },
  { nameKey: "purdue", score: 60 },
  { nameKey: "penn state", score: 60 },
  { nameKey: "university of wisconsin", score: 60 },
  { nameKey: "ohio state", score: 60 },
  { nameKey: "indiana university", score: 60 },
  { nameKey: "boston university", score: 60 },
  { nameKey: "boston college", score: 60 },
  { nameKey: "emory", score: 60 },
  { nameKey: "vanderbilt", score: 60 },
  { nameKey: "rice", score: 60 },
  { nameKey: "georgetown", score: 60 },
  { nameKey: "notre dame", score: 60 },
  { nameKey: "wake forest", score: 60 },
  { nameKey: "university of florida", score: 60 },
  { nameKey: "university of washington", score: 60 },
  { nameKey: "university of southern california", score: 60 },
  { nameKey: "tufts", score: 60 },
  { nameKey: "tulane", score: 60 },
  { nameKey: "lehigh", score: 60 },
  { nameKey: "villanova", score: 60 },
  { nameKey: "university of toronto", score: 60 },
  { nameKey: "mcgill", score: 60 },
  { nameKey: "university of waterloo", score: 60 },
  { nameKey: "ubc", score: 60 },
  { nameKey: "imperial college", score: 60 },
  { nameKey: "ucl", score: 60 },
  { nameKey: "university college london", score: 60 },
  { nameKey: "eth zurich", score: 60 },
  { nameKey: "epfl", score: 60 },
  { nameKey: "tsinghua", score: 60 },
  { nameKey: "peking university", score: 60 },
];

async function seedCareerTracks() {
  for (const track of INITIAL_TRACKS) {
    const [upserted] = await db
      .insert(careerTracks)
      .values({ slug: track.slug, name: track.name, description: track.description, isActive: track.isActive })
      .onConflictDoUpdate({
        target: careerTracks.slug,
        set: { name: track.name, description: track.description, isActive: track.isActive },
      })
      .returning();

    await db
      .insert(trackWeights)
      .values({ trackId: upserted.id, weights: track.weights })
      .onConflictDoUpdate({ target: trackWeights.trackId, set: { weights: track.weights } });
  }
}

async function seedLookupTables() {
  const existingCompany = await db.select().from(companyScores).limit(1);
  if (existingCompany.length === 0) {
    await db.insert(companyScores).values(COMPANY_SCORES);
    console.log(`Seeded ${COMPANY_SCORES.length} company scores`);
  }

  const existingSchool = await db.select().from(schoolScores).limit(1);
  if (existingSchool.length === 0) {
    await db.insert(schoolScores).values(SCHOOL_SCORES);
    console.log(`Seeded ${SCHOOL_SCORES.length} school scores`);
  }
}

export async function seedDatabase() {
  await seedCareerTracks();
  await seedLookupTables();

  const existing = await db.select().from(scores).limit(1);
  if (existing.length > 0) return;

  console.log("Seeding database with sample data...");

  const [companyScoreList, schoolScoreList] = await Promise.all([
    db.select().from(companyScores),
    db.select().from(schoolScores),
  ]);

  const { computeFeatures, computeScore, generateRecommendations, computePercentile } =
    await import("./scoring");

  const seedProfiles = [
    {
      userId: SEED_USER_IDS[0],
      positions: [
        { title: "Software Engineering Intern", company: "Google", startDate: "Jun 2022", endDate: "Aug 2022" },
        { title: "Software Engineering Intern", company: "Meta", startDate: "Jun 2023", endDate: "Aug 2023" },
        { title: "Research Assistant", company: "MIT CSAIL", startDate: "Sep 2023", endDate: "May 2024" },
      ],
      education: [{ institution: "Massachusetts Institute of Technology", degree: "BS", fieldOfStudy: "Computer Science" }],
      skills: ["Python", "Java", "C++", "Machine Learning", "React", "TypeScript", "AWS", "SQL", "Distributed Systems", "Algorithms"],
      connections: 450,
      track: "swe",
    },
    {
      userId: SEED_USER_IDS[1],
      positions: [
        { title: "Summer Analyst", company: "Goldman Sachs", startDate: "Jun 2023", endDate: "Aug 2023" },
        { title: "Investment Banking Intern", company: "Morgan Stanley", startDate: "Jun 2024", endDate: "Aug 2024" },
      ],
      education: [{ institution: "University of Pennsylvania", degree: "BS", fieldOfStudy: "Finance" }],
      skills: ["Financial Modeling", "Valuation", "Excel", "PowerPoint", "Bloomberg Terminal", "M&A"],
      connections: 380,
      track: "finance",
    },
    {
      userId: SEED_USER_IDS[2],
      positions: [
        { title: "Software Engineering Intern", company: "Stripe", startDate: "Jun 2023", endDate: "Aug 2023" },
        { title: "Teaching Assistant", company: "Stanford University", startDate: "Sep 2023", endDate: "Dec 2023" },
        { title: "Software Engineer", company: "Google", startDate: "Jan 2024", endDate: "present" },
      ],
      education: [{ institution: "Stanford University", degree: "BS", fieldOfStudy: "Computer Science" }],
      skills: ["Python", "Go", "Kubernetes", "React", "PostgreSQL", "GraphQL", "Docker", "CI/CD"],
      connections: 290,
      track: "swe",
    },
    {
      userId: SEED_USER_IDS[3],
      positions: [
        { title: "Equity Research Intern", company: "BlackRock", startDate: "Jun 2023", endDate: "Aug 2023" },
        { title: "Analyst Intern", company: "Fidelity", startDate: "Jun 2024", endDate: "Aug 2024" },
        { title: "Investment Club President", company: "Yale University", startDate: "Sep 2022", endDate: "May 2024" },
      ],
      education: [{ institution: "Yale University", degree: "BA", fieldOfStudy: "Economics" }],
      skills: ["Equity Research", "Financial Analysis", "Bloomberg", "Python", "Excel"],
      connections: 320,
      track: "asset_management",
    },
    {
      userId: SEED_USER_IDS[4],
      positions: [
        { title: "Software Engineer Intern", company: "Amazon", startDate: "Jun 2024", endDate: "Aug 2024" },
      ],
      education: [{ institution: "University of Michigan", degree: "BS", fieldOfStudy: "Computer Engineering" }],
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
      profile.skills.map((s) => ({ userId: profile.userId, name: s }))
    );

    const connBatch = Array.from({ length: Math.min(profile.connections, 50) }, (_, i) => ({
      userId: profile.userId,
      name: `Connection ${i + 1}`,
      connectedOn: "2024",
    }));
    await db.insert(connections).values(connBatch);

    const [userPositions, userEducation, userSkills, userConnections] = await Promise.all([
      db.select().from(positions).where(eq(positions.userId, profile.userId)),
      db.select().from(education).where(eq(education.userId, profile.userId)),
      db.select().from(skills).where(eq(skills.userId, profile.userId)),
      db.select().from(connections).where(eq(connections.userId, profile.userId)),
    ]);

    const features = computeFeatures(
      userPositions, userEducation, userSkills, userConnections,
      companyScoreList, schoolScoreList
    );
    features.networkSize = profile.connections;
    await db.insert(computedFeatures).values(features);

    const [trackRow] = await db.select().from(careerTracks).where(eq(careerTracks.slug, profile.track));
    const [twRow] = trackRow
      ? await db.select().from(trackWeights).where(eq(trackWeights.trackId, trackRow.id))
      : [undefined];

    const weights = twRow?.weights ?? {};
    const { totalScore, breakdown } = computeScore(features as any, weights);
    const recs = generateRecommendations(breakdown, weights);

    await db.insert(scores).values({
      userId: profile.userId,
      track: profile.track,
      totalScore,
      percentile: 50,
      factorBreakdown: breakdown,
      recommendations: recs,
    });
  }

  const slugs = ["swe", "finance", "asset_management"];
  for (const slug of slugs) {
    const trackScores = await db.select().from(scores).where(eq(scores.track, slug));
    const allValues = trackScores.map((s) => s.totalScore);
    const { computePercentile } = await import("./scoring");
    for (const s of trackScores) {
      const percentile = computePercentile(s.totalScore, allValues);
      await db.update(scores).set({ percentile }).where(eq(scores.id, s.id));
    }
  }

  console.log("Seeding complete.");
}
