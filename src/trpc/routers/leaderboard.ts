import { asc, avg, count, eq } from "drizzle-orm";
import { analyses, submissions } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const leaderboardRouter = createTRPCRouter({
  stats: baseProcedure.query(async ({ ctx }) => {
    const [totalResult, avgResult] = await Promise.all([
      ctx.db.select({ count: count() }).from(submissions),
      ctx.db
        .select({ avgScore: avg(analyses.score) })
        .from(analyses)
        .where(eq(analyses.status, "completed")),
    ]);

    const totalSubmissions = totalResult[0]?.count ?? 0;
    const rawAvg = avgResult[0]?.avgScore ?? null;
    // avg() returns a string from postgres driver; parse it
    const avgScore = rawAvg !== null ? Number(rawAvg) : null;

    return { totalSubmissions, avgScore };
  }),

  worstEntries: baseProcedure.query(async ({ ctx }) => {
    const [entries, totalResult] = await Promise.all([
      ctx.db
        .select({
          code: submissions.code,
          score: analyses.score,
          language: submissions.language,
        })
        .from(analyses)
        .innerJoin(submissions, eq(analyses.submissionId, submissions.id))
        .where(eq(analyses.status, "completed"))
        .orderBy(asc(analyses.score))
        .limit(3),
      ctx.db
        .select({ count: count() })
        .from(analyses)
        .where(eq(analyses.status, "completed")),
    ]);

    return {
      entries: entries.map((e) => ({
        code: e.code,
        score: e.score ?? 0,
        language: e.language,
      })),
      totalAnalyses: totalResult[0]?.count ?? 0,
    };
  }),
});
