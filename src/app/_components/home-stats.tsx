import { ErrorBoundary } from "react-error-boundary";
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

export function HomeStats() {
  prefetch(trpc.leaderboard.stats.queryOptions());

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<HomeStatsError />}>
        <HomeStatsClient />
      </ErrorBoundary>
    </HydrateClient>
  );
}
