import type { CodeBlockMeta } from "@/components/ui/code-block";
import { CodeBlock } from "@/components/ui/code-block";

interface Entry {
  rank: number;
  score: number;
  language: string;
  lines: number;
  code: string;
}

const ENTRIES: Entry[] = [
  {
    rank: 1,
    score: 1.2,
    language: "javascript",
    lines: 3,
    code: `eval(prompt("enter code"))\ndocument.write(response)\n// trust the user lol`,
  },
  {
    rank: 2,
    score: 1.8,
    language: "typescript",
    lines: 3,
    code: `if (x == true) { return true; }\nelse if (x == false) { return false; }\nelse { return !false; }`,
  },
  {
    rank: 3,
    score: 2.1,
    language: "sql",
    lines: 2,
    code: `SELECT * FROM users WHERE 1=1\n-- TODO: add authentication`,
  },
  {
    rank: 4,
    score: 2.3,
    language: "java",
    lines: 3,
    code: `catch (e) {\n  // ignore\n}`,
  },
  {
    rank: 5,
    score: 2.5,
    language: "javascript",
    lines: 3,
    code: `const sleep = (ms) =>\n  new Date(Date.now() + ms)\n  while(new Date() < end) {}`,
  },
];

function scoreColor(score: number): string {
  if (score <= 3) return "text-accent-red";
  if (score <= 5) return "text-accent-orange";
  return "text-accent-blue";
}

export default async function LeaderboardPage() {
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
            2,847 submissions
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
            avg score: 4.2/10
          </span>
        </div>
      </div>

      {/* Entries */}
      <div className="w-full flex flex-col mb-[60px]" style={{ gap: "20px" }}>
        {ENTRIES.map((entry) => {
          const meta: CodeBlockMeta = {
            rank: entry.rank,
            score: entry.score,
            scoreColor: scoreColor(entry.score),
            language: entry.language,
            lines: entry.lines,
          };
          return (
            <CodeBlock
              key={entry.rank}
              code={entry.code}
              language={entry.language}
              maxHeight={120}
              meta={meta}
            />
          );
        })}
      </div>
    </div>
  );
}
