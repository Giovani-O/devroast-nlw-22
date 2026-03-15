import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { HomeLeaderboardClient } from "./home-leaderboard-client";

function LeaderboardRowSkeleton() {
  return (
    <div
      className="border-b border-border-primary flex items-center"
      style={{ fontSize: "12px", padding: "16px 20px" }}
    >
      <span className="flex-shrink-0" style={{ width: "50px" }}>
        <Skeleton className="h-4 w-4" />
      </span>
      <span className="flex-shrink-0" style={{ width: "70px" }}>
        <Skeleton className="h-4 w-8" />
      </span>
      <span className="flex-1">
        <Skeleton className="h-4 w-3/4" />
      </span>
      <span className="flex-shrink-0" style={{ width: "100px" }}>
        <Skeleton className="h-4 w-16" />
      </span>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <>
      <LeaderboardRowSkeleton />
      <LeaderboardRowSkeleton />
      <LeaderboardRowSkeleton />
      {/* Footer skeleton */}
      <div className="flex justify-center" style={{ paddingTop: "24px" }}>
        <Skeleton className="h-4 w-48" />
      </div>
    </>
  );
}

function LeaderboardError() {
  return (
    <>
      <div
        className="border-b border-border-primary flex items-center font-secondary text-text-tertiary"
        style={{ fontSize: "12px", padding: "16px 20px" }}
      >
        {"// failed to load leaderboard data"}
      </div>
      <div
        className="flex justify-center font-secondary text-text-tertiary"
        style={{ fontSize: "12px", paddingTop: "24px" }}
      >
        <span>{"showing top 0 of \u2014"}</span>
      </div>
    </>
  );
}

export function HomeLeaderboard() {
  prefetch(trpc.leaderboard.worstEntries.queryOptions());

  return (
    <div className="w-full max-w-[960px] flex flex-col gap-6">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="font-mono font-bold text-accent-green"
            style={{ fontSize: "14px" }}
          >
            {"//"}
          </span>
          <span
            className="font-mono font-bold text-text-primary"
            style={{ fontSize: "14px" }}
          >
            shame_leaderboard
          </span>
        </div>
        <Link
          href="/leaderboard"
          className="border border-border-primary font-mono text-text-secondary hover:text-text-primary transition-colors"
          style={{ fontSize: "12px", padding: "6px 12px" }}
        >
          $ view_all &gt;&gt;
        </Link>
      </div>

      {/* Subtitle */}
      <div
        className="font-secondary text-text-tertiary"
        style={{ fontSize: "13px" }}
      >
        {"// the worst code on the internet, ranked by shame"}
      </div>

      {/* Leaderboard Table */}
      <div className="w-full border border-border-primary overflow-hidden">
        {/* Static Table Header */}
        <div
          className="bg-bg-surface border-b border-border-primary flex items-center"
          style={{ fontSize: "12px", height: "40px", padding: "0 20px" }}
        >
          <span
            className="font-mono text-text-tertiary flex-shrink-0"
            style={{ width: "50px" }}
          >
            #
          </span>
          <span
            className="font-mono text-text-tertiary flex-shrink-0"
            style={{ width: "70px" }}
          >
            score
          </span>
          <span className="font-mono text-text-tertiary flex-1">code</span>
          <span
            className="font-mono text-text-tertiary flex-shrink-0"
            style={{ width: "100px" }}
          >
            lang
          </span>
        </div>

        {/* Dynamic Body + Footer with Suspense */}
        <HydrateClient>
          <ErrorBoundary fallback={<LeaderboardError />}>
            <Suspense fallback={<LeaderboardSkeleton />}>
              <HomeLeaderboardClient />
            </Suspense>
          </ErrorBoundary>
        </HydrateClient>
      </div>
    </div>
  );
}
