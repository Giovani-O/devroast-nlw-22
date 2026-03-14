import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { analyses, submissions } from "@/db/schema";

/**
 * Returns the top-scoring completed analyses joined with their submissions.
 */
export async function getLeaderboard(limit = 10) {
  return db
    .select({
      submissionId: submissions.id,
      language: submissions.language,
      score: analyses.score,
      analysisMode: submissions.analysisMode,
      createdAt: submissions.createdAt,
    })
    .from(analyses)
    .innerJoin(submissions, eq(analyses.submissionId, submissions.id))
    .where(eq(analyses.status, "completed"))
    .orderBy(desc(analyses.score))
    .limit(limit);
}

/**
 * Returns the analysis record for a given submission ID.
 */
export async function getAnalysisBySubmission(submissionId: string) {
  const results = await db
    .select()
    .from(analyses)
    .where(eq(analyses.submissionId, submissionId));
  return results[0];
}

/**
 * Returns recent submissions for a given hashed IP address.
 */
export async function getSubmissionsByUser(ipHash: string, limit = 5) {
  return db
    .select()
    .from(submissions)
    .where(eq(submissions.ipHash, ipHash))
    .orderBy(desc(submissions.createdAt))
    .limit(limit);
}

/**
 * Returns the total count of all submissions.
 */
export async function getTotalSubmissions(): Promise<number> {
  const result = await db
    .select({ count: sql<string>`count(*)` })
    .from(submissions);
  return Number(result[0].count);
}

/**
 * Returns average score and submission count grouped by programming language.
 */
export async function getAverageScoreByLanguage() {
  return db
    .select({
      language: submissions.language,
      avgScore: sql<string>`avg(${analyses.score})`,
      count: sql<string>`count(*)`,
    })
    .from(analyses)
    .innerJoin(submissions, eq(analyses.submissionId, submissions.id))
    .where(eq(analyses.status, "completed"))
    .groupBy(submissions.language);
}
