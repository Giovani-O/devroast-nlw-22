import { HomeEditorClient } from "./_components/home-editor-client";
import { HomeLeaderboard } from "./_components/home-leaderboard";
import { HomeStats } from "./_components/home-stats";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* Hero Section */}
      <div className="w-full max-w-[780px] flex flex-col gap-3 mx-auto">
        {/* Title */}
        <div className="flex items-center justify-center gap-3">
          <span
            className="font-mono font-bold text-accent-green"
            style={{ fontSize: "36px" }}
          >
            $
          </span>
          <span
            className="font-mono font-bold text-text-primary"
            style={{ fontSize: "36px" }}
          >
            paste your code. get roasted.
          </span>
        </div>

        {/* Subtitle */}
        <div
          className="font-secondary text-text-secondary text-center"
          style={{ fontSize: "14px" }}
        >
          {
            "// drop your code below and we'll rate it — brutally honest or full roast mode"
          }
        </div>
      </div>

      {/* Interactive editor + actions (client component) */}
      <HomeEditorClient />

      {/* Footer Stats — live from DB via tRPC */}
      <HomeStats />

      {/* Spacer */}
      <div style={{ height: "60px" }} />

      {/* Leaderboard Preview — live from DB via tRPC */}
      <HomeLeaderboard />

      {/* Bottom Spacer */}
      <div style={{ height: "60px" }} />
    </div>
  );
}
