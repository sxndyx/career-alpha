import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import type { InsertPosition, InsertEducation, InsertSkill, InsertConnection } from "@shared/schema";

interface ParsedData {
  positions: InsertPosition[];
  education: InsertEducation[];
  skills: InsertSkill[];
  connections: InsertConnection[];
}

function parseCsv(content: string): Record<string, string>[] {
  try {
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });
  } catch {
    return [];
  }
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_-]+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function findColumn(row: Record<string, string>, ...candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const normalized = normalizeHeader(candidate);
    for (const key of Object.keys(row)) {
      if (normalizeHeader(key) === normalized) {
        return row[key] || undefined;
      }
    }
  }
  return undefined;
}

function parsePositionsCsv(content: string, userId: string): InsertPosition[] {
  const rows = parseCsv(content);
  return rows.map((row) => ({
    userId,
    title: findColumn(row, "Title", "Position Title", "title"),
    company: findColumn(row, "Company Name", "Company", "Organization Name", "company_name"),
    location: findColumn(row, "Location", "location"),
    startDate: findColumn(row, "Started On", "Start Date", "started_on"),
    endDate: findColumn(row, "Finished On", "End Date", "finished_on"),
    description: findColumn(row, "Description", "description"),
  })).filter((p) => p.title || p.company);
}

function parseEducationCsv(content: string, userId: string): InsertEducation[] {
  const rows = parseCsv(content);
  return rows.map((row) => ({
    userId,
    institution: findColumn(row, "School Name", "Institution", "school_name"),
    degree: findColumn(row, "Degree Name", "Degree", "degree_name"),
    fieldOfStudy: findColumn(row, "Field of Study", "Notes", "field_of_study"),
    startDate: findColumn(row, "Start Date", "started_on"),
    endDate: findColumn(row, "End Date", "finished_on"),
  })).filter((e) => e.institution);
}

function parseSkillsCsv(content: string, userId: string): InsertSkill[] {
  const rows = parseCsv(content);
  return rows.map((row) => ({
    userId,
    name: findColumn(row, "Name", "Skill", "skill_name") || "",
  })).filter((s) => s.name);
}

function parseConnectionsCsv(content: string, userId: string): InsertConnection[] {
  const rows = parseCsv(content);
  return rows.map((row) => {
    const firstName = findColumn(row, "First Name", "first_name") || "";
    const lastName = findColumn(row, "Last Name", "last_name") || "";
    return {
      userId,
      name: `${firstName} ${lastName}`.trim() || findColumn(row, "Name", "name") || null,
      connectedOn: findColumn(row, "Connected On", "connected_on"),
    };
  }).filter((c) => c.name);
}

function detectAndParseCsvContent(content: string, fileName: string, userId: string, result: ParsedData) {
  const lowerName = fileName.toLowerCase();

  if (lowerName.includes("position") || lowerName.includes("experience")) {
    result.positions.push(...parsePositionsCsv(content, userId));
  } else if (lowerName.includes("education")) {
    result.education.push(...parseEducationCsv(content, userId));
  } else if (lowerName.includes("skill")) {
    result.skills.push(...parseSkillsCsv(content, userId));
  } else if (lowerName.includes("connection")) {
    result.connections.push(...parseConnectionsCsv(content, userId));
  } else {
    const rows = parseCsv(content);
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).map(normalizeHeader);

    if (headers.some((h) => h.includes("company") || h.includes("title"))) {
      result.positions.push(...parsePositionsCsv(content, userId));
    } else if (headers.some((h) => h.includes("school") || h.includes("degree"))) {
      result.education.push(...parseEducationCsv(content, userId));
    } else if (headers.some((h) => h === "name" || h === "skill")) {
      result.skills.push(...parseSkillsCsv(content, userId));
    } else if (headers.some((h) => h.includes("first_name") || h.includes("connected"))) {
      result.connections.push(...parseConnectionsCsv(content, userId));
    }
  }
}

export function parseLinkedInData(buffer: Buffer, fileName: string, userId: string): ParsedData {
  const result: ParsedData = {
    positions: [],
    education: [],
    skills: [],
    connections: [],
  };

  if (fileName.endsWith(".zip")) {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      if (entry.isDirectory || !entry.entryName.endsWith(".csv")) continue;
      const content = entry.getData().toString("utf-8");
      detectAndParseCsvContent(content, entry.entryName, userId, result);
    }
  } else if (fileName.endsWith(".csv")) {
    const content = buffer.toString("utf-8");
    detectAndParseCsvContent(content, fileName, userId, result);
  }

  return result;
}
