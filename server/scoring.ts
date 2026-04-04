import type { Position, Education, Skill, Connection, ComputedFeatures, ProfileOverrides } from "@shared/schema";

function matchesTier(name: string, entries: Array<{ nameKey: string; score: number }>): number {
  const lower = name.toLowerCase().trim();
  let best = 0;
  for (const entry of entries) {
    if (lower.includes(entry.nameKey)) {
      best = Math.max(best, entry.score);
    }
  }
  return best;
}

function isInternship(title: string | null): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  return lower.includes("intern") || lower.includes("co-op") || lower.includes("trainee");
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function parsePositionDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const s = dateStr.trim().toLowerCase();
  if (s.includes("present") || s.includes("current")) return new Date();

  const iso = dateStr.match(/^(\d{4})-(\d{2})/);
  if (iso) return new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, 1);

  const monthYear = s.match(/^([a-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const m = MONTH_MAP[monthYear[1]];
    if (m !== undefined) return new Date(parseInt(monthYear[2]), m, 1);
  }

  const yearOnly = s.match(/^\d{4}$/);
  if (yearOnly) return new Date(parseInt(yearOnly[0]), 0, 1);

  return null;
}

function computeConsistencyScore(positionList: Position[]): number {
  if (positionList.length === 0) return 0;

  const parsed = positionList
    .map((p) => ({
      start: parsePositionDate(p.startDate),
      end: parsePositionDate(p.endDate) ?? new Date(),
    }))
    .filter((r) => r.start !== null)
    .sort((a, b) => a.start!.getTime() - b.start!.getTime());

  if (parsed.length === 0) return Math.min(100, positionList.length * 15);

  const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;

  let totalTenureMonths = 0;
  let totalGapMonths = 0;

  for (let i = 0; i < parsed.length; i++) {
    const { start, end } = parsed[i];
    const tenure = Math.max(0, (end.getTime() - start!.getTime()) / msPerMonth);
    totalTenureMonths += tenure;

    if (i > 0) {
      const prevEnd = parsed[i - 1].end;
      const gap = Math.max(0, (start!.getTime() - prevEnd.getTime()) / msPerMonth);
      totalGapMonths += gap;
    }
  }

  const tenureScore = Math.min(60, (totalTenureMonths / 36) * 60);
  const continuityBonus = Math.min(25, parsed.length * 5);
  const gapPenalty = Math.min(40, totalGapMonths * 1.5);

  return Math.max(0, Math.min(100, tenureScore + continuityBonus - gapPenalty));
}

export function computeFeatures(
  userPositions: Position[],
  userEducation: Education[],
  userSkills: Skill[],
  userConnections: Connection[],
  companyScoreList: Array<{ nameKey: string; score: number }>,
  schoolScoreList: Array<{ nameKey: string; score: number }>,
  overrides?: ProfileOverrides
): Omit<ComputedFeatures, "id" | "computedAt"> & { userId: string } {
  const userId =
    userPositions[0]?.userId ||
    userEducation[0]?.userId ||
    userSkills[0]?.userId ||
    userConnections[0]?.userId ||
    "";

  const excludeIds = new Set(overrides?.excludePositionIds ?? []);
  const effectivePositions = userPositions.filter((p) => !excludeIds.has(p.id));

  const internshipCount =
    overrides?.internshipOverride !== undefined
      ? overrides.internshipOverride
      : effectivePositions.filter((p) => isInternship(p.title)).length;

  const totalRoles = effectivePositions.length;

  let maxBrandScore = 0;
  let brandSum = 0;
  for (const pos of effectivePositions) {
    const company = pos.company || "";
    const override = overrides?.companyTierOverrides?.[company.toLowerCase()];
    const tier = override !== undefined ? override : matchesTier(company, companyScoreList);

    brandSum += tier;
    maxBrandScore = Math.max(maxBrandScore, tier);
  }
  const brandScore =
    totalRoles > 0 ? Math.min(100, (brandSum / totalRoles + maxBrandScore) / 2) : 0;

  let educationTierScore = 0;
  for (const edu of userEducation) {
    const inst = edu.institution || "";
    const override = overrides?.schoolTierOverrides?.[inst.toLowerCase()];
    const tier = override !== undefined ? override : matchesTier(inst, schoolScoreList);
    educationTierScore = Math.max(educationTierScore, tier);
  }

  const skillDensity =
    totalRoles > 0 ? userSkills.length / totalRoles : userSkills.length;
  const networkSize = userConnections.length;

  const now = new Date();
  let recencyScore = 0;
  for (const pos of effectivePositions) {
    if (!pos.endDate || pos.endDate.toLowerCase().includes("present")) {
      recencyScore = 100;
      break;
    }
    const endDate = parsePositionDate(pos.endDate);
    if (endDate) {
      const monthsAgo =
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      if (monthsAgo <= 12) {
        recencyScore = Math.max(recencyScore, 90);
      } else if (monthsAgo <= 24) {
        recencyScore = Math.max(recencyScore, 70);
      } else if (monthsAgo <= 36) {
        recencyScore = Math.max(recencyScore, 50);
      } else {
        recencyScore = Math.max(recencyScore, 20);
      }
    } else {
      recencyScore = Math.max(recencyScore, 30);
    }
  }

  const seniorityLevels = [
    "intern", "junior", "associate", "analyst", "senior", "lead",
    "principal", "director", "vp", "cto", "ceo", "head", "manager",
  ];
  let maxSeniority = 0;
  for (const pos of effectivePositions) {
    const titleLower = (pos.title || "").toLowerCase();
    for (let i = 0; i < seniorityLevels.length; i++) {
      if (titleLower.includes(seniorityLevels[i])) {
        maxSeniority = Math.max(maxSeniority, i);
      }
    }
  }
  const seniorityProgressionScore = Math.min(
    100,
    (maxSeniority / (seniorityLevels.length - 1)) * 100
  );

  const consistencyScore = computeConsistencyScore(effectivePositions);

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

export function computeScore(
  features: ComputedFeatures,
  weights: Record<string, number>
) {
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

export function generateRecommendations(
  breakdown: Record<string, number>,
  weights: Record<string, number>
): string[] {
  const recommendations: string[] = [];
  const sorted = Object.entries(breakdown).sort(([, a], [, b]) => a - b);

  for (const [key] of sorted) {
    if (recommendations.length >= 3) break;
    const weight = weights[key] || 0;
    if (weight === 0) continue;

    switch (key) {
      case "internship_count":
        recommendations.push(
          "Pursue additional internships or co-op experiences to strengthen your practical background."
        );
        break;
      case "brand_score":
        recommendations.push(
          "Target higher-tier companies and institutions for your next role to boost brand recognition."
        );
        break;
      case "skill_density":
        recommendations.push(
          "Add more quantified technical skills to your profile. Include specific tools, languages, and frameworks."
        );
        break;
      case "education_tier_score":
        recommendations.push(
          "Consider graduate programs at top-tier institutions or professional certifications to elevate your education profile."
        );
        break;
      case "seniority_progression_score":
        recommendations.push(
          "Seek roles with increasing responsibility and seniority-indicating titles to show career progression."
        );
        break;
      case "network_size":
        recommendations.push(
          "Expand your professional network by connecting with peers, recruiters, and industry leaders."
        );
        break;
      case "recency_score":
        recommendations.push(
          "Keep your profile current with recent experiences. Active profiles rank significantly higher."
        );
        break;
      case "consistency_score":
        recommendations.push(
          "Build a consistent work history with clear progression. Avoid unexplained career gaps."
        );
        break;
    }
  }

  return recommendations;
}

export function computePercentile(userScore: number, allScores: number[]): number {
  if (allScores.length === 0) return 100;
  const total = allScores.length;
  const below = allScores.filter((s) => s < userScore).length;
  const equal = allScores.filter((s) => s === userScore).length;
  return Math.round(((below + 0.5 * equal) / total) * 100 * 10) / 10;
}
