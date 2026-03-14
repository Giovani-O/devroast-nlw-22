"use client";

import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function HomeStatsClient() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.leaderboard.stats.queryOptions());

  const total = data?.totalSubmissions ?? 0;
  const avg = data?.avgScore ?? 0;

  return (
    <div
      className="flex items-center gap-6 justify-center font-secondary text-text-tertiary tabular-nums"
      style={{ fontSize: "12px" }}
    >
      <span className="flex items-center gap-1">
        <NumberFlow value={total} />
        {" codes roasted"}
      </span>
      <span>·</span>
      <span className="flex items-center gap-1">
        {"avg score: "}
        <NumberFlow
          value={avg}
          format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
          suffix="/10"
        />
      </span>
    </div>
  );
}
