import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const MAX_PAGES = 100;

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");

  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("leaderboard-stats", "max");

  for (let i = 1; i <= MAX_PAGES; i++) {
    revalidateTag(`leaderboard-page-${i}`, "max");
  }

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    tags: [
      "leaderboard-stats",
      ...Array.from(
        { length: MAX_PAGES },
        (_, i) => `leaderboard-page-${i + 1}`,
      ),
    ],
  });
}
