import { avg, count, eq } from "drizzle-orm";
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
});
