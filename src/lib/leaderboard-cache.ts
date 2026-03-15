import { asc, avg, count, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db/client";
import { analyses, submissions } from "@/db/schema";

const CACHE_DURATION = 60 * 10; // 10 minutes in seconds
const PAGE_SIZE = 10;

export async function getLeaderboardStats() {
  "use cache";
  cacheTag("leaderboard-stats");
  cacheLife({
    stale: CACHE_DURATION,
    revalidate: CACHE_DURATION,
    expire: CACHE_DURATION,
  });

  const [totalResult, avgResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(analyses)
      .where(eq(analyses.status, "completed")),
    db
      .select({ avgScore: avg(analyses.score) })
      .from(analyses)
      .where(eq(analyses.status, "completed")),
  ]);

  const totalSubmissions = totalResult[0]?.count ?? 0;
  const rawAvg = avgResult[0]?.avgScore ?? null;
  const avgScore = rawAvg !== null ? Number(rawAvg) : null;

  return { totalSubmissions, avgScore };
}

export async function getLeaderboardPage(page: number) {
  "use cache";
  cacheTag(`leaderboard-page-${page}`);
  cacheLife({
    stale: CACHE_DURATION,
    revalidate: CACHE_DURATION,
    expire: CACHE_DURATION,
  });

  const entries = await db
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
    .offset((page - 1) * PAGE_SIZE);

  const totalResult = await db
    .select({ count: count() })
    .from(analyses)
    .where(eq(analyses.status, "completed"));

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
}
