import "server-only";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getLeaderboardPage,
  getLeaderboardStats,
} from "@/lib/leaderboard-cache";
import { LeaderboardEntries } from "./_components/leaderboard-entries";

function CardSkeleton() {
  return (
    <div
      className="w-full border border-border-primary overflow-hidden"
      style={{ borderColor: "#2A2A2A" }}
    >
      {/* Header skeleton */}
      <div
        className="flex items-center justify-between w-full bg-bg-page"
        style={{
          height: "40px",
          padding: "0 16px",
          borderBottom: "1px solid #2A2A2A",
        }}
      >
        <div className="flex items-center" style={{ gap: "16px" }}>
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center" style={{ gap: "12px" }}>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      {/* Body skeleton */}
      <div
        className="flex"
        style={{ backgroundColor: "var(--color-bg-input)" }}
      >
        <div
          className="flex flex-col items-end bg-bg-surface flex-shrink-0"
          style={{
            width: "40px",
            padding: "12px 10px",
            gap: "6px",
            borderRight: "1px solid #2A2A2A",
          }}
        >
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="flex-1 flex flex-col gap-1" style={{ padding: "12px" }}>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

function EntriesSkeleton() {
  return (
    <div className="w-full flex flex-col" style={{ gap: "20px" }}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

function EntriesError() {
  return (
    <div
      className="font-secondary text-text-tertiary text-center"
      style={{ fontSize: "12px", padding: "40px 0" }}
    >
      {"// failed to load leaderboard entries"}
    </div>
  );
}

export default async function LeaderboardPage() {
  const stats = await getLeaderboardStats();
  const initialData = await getLeaderboardPage(1);

  const avgDisplay =
    stats.avgScore !== null ? `${stats.avgScore.toFixed(1)}/10` : "--/10";

  return (
    <div className="w-full flex flex-col" style={{ gap: "40px" }}>
      {/* Hero Section */}
      <div className="w-full flex flex-col" style={{ gap: "16px" }}>
        {/* Title */}
        <div className="flex items-center" style={{ gap: "12px" }}>
          <span
            className="font-mono font-bold text-accent-green"
            style={{ fontSize: "32px" }}
          >
            &gt;
          </span>
          <span
            className="font-mono font-bold text-text-primary"
            style={{ fontSize: "28px" }}
          >
            shame_leaderboard
          </span>
        </div>

        {/* Subtitle */}
        <p
          className="font-secondary text-text-secondary"
          style={{ fontSize: "14px" }}
        >
          {"// the most roasted code on the internet"}
        </p>

        {/* Stats Row */}
        <div className="flex items-center" style={{ gap: "8px" }}>
          <span
            className="font-secondary text-text-tertiary"
            style={{ fontSize: "12px" }}
          >
            {`${stats.totalSubmissions.toLocaleString()} submissions`}
          </span>
          <span
            className="font-secondary text-text-tertiary"
            style={{ fontSize: "12px" }}
          >
            ·
          </span>
          <span
            className="font-secondary text-text-tertiary"
            style={{ fontSize: "12px" }}
          >
            {`avg score: ${avgDisplay}`}
          </span>
        </div>
      </div>

      {/* Entries */}
      <Suspense fallback={<EntriesSkeleton />}>
        <ErrorBoundary fallback={<EntriesError />}>
          <LeaderboardEntries initialData={initialData} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
