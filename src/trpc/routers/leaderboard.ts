import { asc, avg, count, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { analyses, submissions } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

const PAGE_SIZE = 10;

export const leaderboardRouter = createTRPCRouter({
  stats: baseProcedure.query(async ({ ctx }) => {
    const [totalResult, avgResult] = await Promise.all([
      ctx.db
        .select({ count: count() })
        .from(analyses)
        .where(eq(analyses.status, "completed")),
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

  paginatedEntries: baseProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(async ({ ctx, input }) => {
      const { page } = input;

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
          .limit(PAGE_SIZE)
          .offset((page - 1) * PAGE_SIZE),
        ctx.db
          .select({ count: count() })
          .from(analyses)
          .where(eq(analyses.status, "completed")),
      ]);

      const totalCount = totalResult[0]?.count ?? 0;

      return {
        entries: entries.map((e) => ({
          code: e.code,
          score: e.score ?? 0,
          language: e.language,
        })),
        totalCount,
        totalPages: Math.ceil(totalCount / PAGE_SIZE),
      };
    }),
});
