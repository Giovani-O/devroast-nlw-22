import { createTRPCRouter } from "../init";
import { analysisRouter } from "./analysis";
import { leaderboardRouter } from "./leaderboard";

export const appRouter = createTRPCRouter({
  analysis: analysisRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
