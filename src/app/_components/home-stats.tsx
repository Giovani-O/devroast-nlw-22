import { headers } from "next/headers";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { HomeStatsClient } from "./home-stats-client";

// Fallback shown on DB/network error
function HomeStatsError() {
  return (
    <div
      className="flex items-center gap-6 justify-center font-secondary text-text-tertiary"
      style={{ fontSize: "12px" }}
    >
      <span>— codes roasted</span>
      <span>·</span>
      <span>avg score: —</span>
    </div>
  );
}

async function HomeStatsContent() {
  // Establish request-dynamic context before dehydrate() runs in HydrateClient
  await headers();
  prefetch(trpc.leaderboard.stats.queryOptions());

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<HomeStatsError />}>
        <HomeStatsClient />
      </ErrorBoundary>
    </HydrateClient>
  );
}

export function HomeStats() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center gap-6 justify-center font-secondary text-text-tertiary"
          style={{ fontSize: "12px" }}
        >
          <Skeleton className="h-4 w-[100px]" />
          <span>·</span>
          <Skeleton className="h-4 w-[80px]" />
        </div>
      }
    >
      <HomeStatsContent />
    </Suspense>
  );
}
