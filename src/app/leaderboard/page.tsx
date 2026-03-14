import { codeToHtml } from "shiki";

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
  const rendered = await Promise.all(
    ENTRIES.map(async (entry) => {
      const raw = await codeToHtml(entry.code, {
        lang: entry.language,
        theme: "vesper",
      });
      // Strip inline background-color from shiki's <pre> so our container bg shows through.
      // CSS can't override inline styles without !important, so we remove it at the source.
      const codeHtml = raw.replace(
        /(<pre\b[^>]+)style="([^"]*)"/,
        (_, pre: string, style: string) =>
          `${pre}style="${style.replace(/background(?:-color)?:[^;]+;?\s*/gi, "")}"`,
      );
      return { ...entry, codeHtml };
    }),
  );

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
        {rendered.map((entry) => {
          const lineNums = Array.from({ length: entry.lines }, (_, i) => i + 1);

          return (
            <div
              key={entry.rank}
              className="w-full border border-border-primary overflow-hidden"
            >
              {/* Meta Row */}
              <div
                className="flex items-center justify-between border-b border-border-primary"
                style={{ height: "48px", padding: "0 20px" }}
              >
                {/* Left: rank + score */}
                <div className="flex items-center" style={{ gap: "16px" }}>
                  {/* Rank */}
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    <span
                      className="font-mono text-text-tertiary"
                      style={{ fontSize: "12px" }}
                    >
                      #
                    </span>
                    <span
                      className="font-mono font-bold text-accent-amber"
                      style={{ fontSize: "14px" }}
                    >
                      {entry.rank}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    <span
                      className="font-mono text-text-tertiary"
                      style={{ fontSize: "12px" }}
                    >
                      score:
                    </span>
                    <span
                      className={`font-mono font-bold ${scoreColor(entry.score)}`}
                      style={{ fontSize: "13px" }}
                    >
                      {entry.score}
                    </span>
                  </div>
                </div>

                {/* Right: language + lines */}
                <div className="flex items-center" style={{ gap: "12px" }}>
                  <span
                    className="font-mono text-text-secondary"
                    style={{ fontSize: "12px" }}
                  >
                    {entry.language}
                  </span>
                  <span
                    className="font-mono text-text-tertiary"
                    style={{ fontSize: "12px" }}
                  >
                    {entry.lines} lines
                  </span>
                </div>
              </div>

              {/* Code Block */}
              <div
                className="flex bg-bg-input overflow-hidden"
                style={{ height: "120px" }}
              >
                {/* Line Numbers */}
                <div
                  className="flex flex-col items-end bg-bg-surface border-r border-border-primary flex-shrink-0"
                  style={{
                    width: "40px",
                    padding: "14px 10px",
                    gap: "6px",
                  }}
                >
                  {lineNums.map((n) => (
                    <span
                      key={n}
                      className="font-mono text-text-tertiary"
                      style={{ fontSize: "12px", lineHeight: "1.6" }}
                    >
                      {n}
                    </span>
                  ))}
                </div>

                {/* Shiki-highlighted code */}
                <div
                  className="flex-1 overflow-hidden leaderboard-code"
                  style={{ padding: "14px 16px" }}
                >
                  <div
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki outputs pre-escaped HTML
                    dangerouslySetInnerHTML={{ __html: entry.codeHtml }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
