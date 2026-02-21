import type { Position, Education, Skill, Connection, ComputedFeatures, Track } from "@shared/schema";

const TIER_1_COMPANIES = new Set([
  "google", "meta", "apple", "amazon", "microsoft", "netflix", "nvidia",
  "goldman sachs", "morgan stanley", "j.p. morgan", "jpmorgan", "blackrock",
  "citadel", "two sigma", "jane street", "de shaw", "bridgewater",
  "mckinsey", "bain", "boston consulting", "bcg",
  "stripe", "airbnb", "uber", "openai", "palantir", "tesla", "spacex",
  "databricks", "snowflake", "coinbase", "robinhood", "bloomberg",
  "barclays", "deutsche bank", "ubs", "credit suisse", "citi", "citigroup",
  "lazard", "evercore", "moelis", "centerview", "pjt partners",
  "kkr", "carlyle", "apollo", "blackstone", "warburg pincus",
  "fidelity", "vanguard", "t. rowe price", "wellington", "pimco",
]);

const TIER_2_COMPANIES = new Set([
  "salesforce", "adobe", "oracle", "ibm", "intel", "qualcomm", "cisco",
  "linkedin", "twitter", "snap", "pinterest", "spotify", "dropbox",
  "square", "block", "shopify", "atlassian", "vmware", "workday",
  "deloitte", "pwc", "kpmg", "ey", "ernst & young", "accenture",
  "rbc", "td", "bmo", "scotiabank", "hsbc", "bnp paribas",
  "wells fargo", "bank of america", "charles schwab",
  "state street", "invesco", "legg mason", "franklin templeton",
]);

const TIER_1_SCHOOLS = new Set([
  "harvard", "stanford", "mit", "princeton", "yale", "columbia",
  "university of pennsylvania", "upenn", "wharton",
  "university of chicago", "duke", "northwestern", "caltech",
  "dartmouth", "brown", "cornell", "johns hopkins",
  "london school of economics", "lse", "oxford", "cambridge",
  "insead", "london business school",
  "berkeley", "uc berkeley", "ucla", "carnegie mellon",
  "georgia institute of technology", "georgia tech",
  "university of michigan", "nyu", "new york university",
]);

const TIER_2_SCHOOLS = new Set([
  "university of virginia", "uva", "university of texas",
  "university of illinois", "purdue", "penn state",
  "university of wisconsin", "ohio state", "indiana university",
  "boston university", "boston college", "emory", "vanderbilt",
  "rice", "georgetown", "notre dame", "wake forest",
  "university of florida", "university of washington",
  "university of southern california", "usc",
  "tufts", "tulane", "lehigh", "villanova",
  "toronto", "mcgill", "waterloo", "ubc",
  "imperial college", "ucl", "university college london",
  "eth zurich", "epfl", "tsinghua", "peking university",
]);

function matchesTier(name: string, tierSet: Set<string>): boolean {
  const lower = name.toLowerCase().trim();
  for (const entry of tierSet) {
    if (lower.includes(entry)) return true;
  }
  return false;
}

function isInternship(title: string | null): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  return lower.includes("intern") || lower.includes("co-op") || lower.includes("trainee");
}

export function computeFeatures(
  userPositions: Position[],
  userEducation: Education[],
  userSkills: Skill[],
  userConnections: Connection[]
): Omit<ComputedFeatures, "id" | "computedAt"> & { userId: string } {
  const userId = userPositions[0]?.userId || userEducation[0]?.userId || userSkills[0]?.userId || userConnections[0]?.userId || "";

  const internshipCount = userPositions.filter((p) => isInternship(p.title)).length;
  const totalRoles = userPositions.length;

  let maxBrandScore = 0;
  let brandSum = 0;
  for (const pos of userPositions) {
    const company = pos.company || "";
    if (matchesTier(company, TIER_1_COMPANIES)) {
      brandSum += 100;
      maxBrandScore = Math.max(maxBrandScore, 100);
    } else if (matchesTier(company, TIER_2_COMPANIES)) {
      brandSum += 60;
      maxBrandScore = Math.max(maxBrandScore, 60);
    } else if (company) {
      brandSum += 20;
      maxBrandScore = Math.max(maxBrandScore, 20);
    }
  }
  const brandScore = totalRoles > 0 ? Math.min(100, (brandSum / totalRoles + maxBrandScore) / 2) : 0;

  let educationTierScore = 0;
  for (const edu of userEducation) {
    const inst = edu.institution || "";
    if (matchesTier(inst, TIER_1_SCHOOLS)) {
      educationTierScore = Math.max(educationTierScore, 100);
    } else if (matchesTier(inst, TIER_2_SCHOOLS)) {
      educationTierScore = Math.max(educationTierScore, 60);
    } else if (inst) {
      educationTierScore = Math.max(educationTierScore, 25);
    }
  }

  const skillDensity = totalRoles > 0 ? userSkills.length / totalRoles : userSkills.length;
  const networkSize = userConnections.length;

  const now = new Date();
  let recencyScore = 0;
  for (const pos of userPositions) {
    if (!pos.endDate || pos.endDate.toLowerCase().includes("present")) {
      recencyScore = 100;
      break;
    }
    try {
      const endYear = parseInt(pos.endDate.split(/[\s,/-]/).pop() || "0");
      if (endYear >= now.getFullYear() - 1) {
        recencyScore = Math.max(recencyScore, 90);
      } else if (endYear >= now.getFullYear() - 2) {
        recencyScore = Math.max(recencyScore, 70);
      } else if (endYear >= now.getFullYear() - 3) {
        recencyScore = Math.max(recencyScore, 50);
      } else {
        recencyScore = Math.max(recencyScore, 20);
      }
    } catch {
      recencyScore = Math.max(recencyScore, 30);
    }
  }

  const seniorityLevels = ["intern", "junior", "associate", "analyst", "senior", "lead", "principal", "director", "vp", "cto", "ceo", "head", "manager"];
  let maxSeniority = 0;
  for (const pos of userPositions) {
    const titleLower = (pos.title || "").toLowerCase();
    for (let i = 0; i < seniorityLevels.length; i++) {
      if (titleLower.includes(seniorityLevels[i])) {
        maxSeniority = Math.max(maxSeniority, i);
      }
    }
  }
  const seniorityProgressionScore = Math.min(100, (maxSeniority / (seniorityLevels.length - 1)) * 100);

  let consistencyScore = 0;
  if (totalRoles > 0) {
    const hasGaps = totalRoles > 1;
    const avgTenure = totalRoles > 0 ? Math.max(1, 5 / totalRoles) : 0;
    consistencyScore = Math.min(100, totalRoles * 15 + (hasGaps ? 10 : 30) + avgTenure * 10);
  }

  return {
    userId,
    internshipCount,
    totalRoles,
    brandScore: Math.round(brandScore * 10) / 10,
    educationTierScore,
    skillDensity: Math.round(skillDensity * 10) / 10,
    seniorityProgressionScore: Math.round(seniorityProgressionScore * 10) / 10,
    networkSize,
    recencyScore,
    consistencyScore: Math.round(consistencyScore * 10) / 10,
  };
}

const TRACK_WEIGHTS: Record<string, Record<string, number>> = {
  swe: {
    internship_count: 0.25,
    brand_score: 0.20,
    skill_density: 0.20,
    education_tier_score: 0.15,
    seniority_progression_score: 0.10,
    network_size: 0.10,
  },
  finance: {
    brand_score: 0.30,
    internship_count: 0.25,
    education_tier_score: 0.20,
    consistency_score: 0.15,
    network_size: 0.10,
  },
  asset_management: {
    internship_count: 0.30,
    brand_score: 0.25,
    education_tier_score: 0.20,
    recency_score: 0.15,
    network_size: 0.10,
  },
};

function normalizeFeature(key: string, value: number): number {
  switch (key) {
    case "internship_count":
      return Math.min(100, (value / 5) * 100);
    case "brand_score":
    case "education_tier_score":
    case "recency_score":
    case "consistency_score":
    case "seniority_progression_score":
      return Math.min(100, value);
    case "skill_density":
      return Math.min(100, (value / 10) * 100);
    case "network_size":
      return Math.min(100, (value / 500) * 100);
    default:
      return Math.min(100, value);
  }
}

export function computeScore(features: ComputedFeatures, track: string) {
  const weights = TRACK_WEIGHTS[track];
  if (!weights) throw new Error(`Unknown track: ${track}`);

  const featureMap: Record<string, number> = {
    internship_count: features.internshipCount || 0,
    brand_score: features.brandScore || 0,
    skill_density: features.skillDensity || 0,
    education_tier_score: features.educationTierScore || 0,
    seniority_progression_score: features.seniorityProgressionScore || 0,
    network_size: features.networkSize || 0,
    recency_score: features.recencyScore || 0,
    consistency_score: features.consistencyScore || 0,
  };

  const breakdown: Record<string, number> = {};
  let totalScore = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const normalized = normalizeFeature(key, featureMap[key] || 0);
    const contribution = normalized * weight;
    breakdown[key] = Math.round(contribution * 100) / 100;
    totalScore += contribution;
  }

  totalScore = Math.round(totalScore * 100) / 100;

  return { totalScore, breakdown };
}

export function generateRecommendations(breakdown: Record<string, number>, track: string): string[] {
  const weights = TRACK_WEIGHTS[track];
  if (!weights) return [];

  const recommendations: string[] = [];

  const sorted = Object.entries(breakdown)
    .sort(([, a], [, b]) => a - b);

  for (const [key] of sorted) {
    if (recommendations.length >= 3) break;
    const weight = weights[key] || 0;
    if (weight === 0) continue;

    switch (key) {
      case "internship_count":
        recommendations.push("Pursue additional internships or co-op experiences to strengthen your practical background.");
        break;
      case "brand_score":
        recommendations.push("Target higher-tier companies and institutions for your next role to boost brand recognition.");
        break;
      case "skill_density":
        recommendations.push("Add more quantified technical skills to your profile. Include specific tools, languages, and frameworks.");
        break;
      case "education_tier_score":
        recommendations.push("Consider graduate programs at top-tier institutions or professional certifications to elevate your education profile.");
        break;
      case "seniority_progression_score":
        recommendations.push("Seek roles with increasing responsibility and seniority-indicating titles to show career progression.");
        break;
      case "network_size":
        recommendations.push("Expand your professional network by connecting with peers, recruiters, and industry leaders.");
        break;
      case "recency_score":
        recommendations.push("Keep your profile current with recent experiences. Active profiles rank significantly higher.");
        break;
      case "consistency_score":
        recommendations.push("Build a consistent work history with clear progression. Avoid unexplained career gaps.");
        break;
    }
  }

  return recommendations;
}

export function computePercentile(userScore: number, allScores: number[]): number {
  if (allScores.length <= 1) return 100;
  const below = allScores.filter((s) => s < userScore).length;
  return Math.round((below / (allScores.length - 1)) * 100 * 10) / 10;
}
