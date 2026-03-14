import { codeToHtml } from "shiki";

export interface CodeBlockMeta {
  rank: number;
  score: number;
  scoreColor: string;
  language: string;
  lines: number;
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  maxHeight?: number;
  meta?: CodeBlockMeta;
}

export async function CodeBlock({
  code,
  language = "javascript",
  maxHeight,
  meta,
}: CodeBlockProps) {
  const lineCount = code.split("\n").length;
  const lineNums = Array.from({ length: lineCount }, (_, i) => i + 1);

  const raw = await codeToHtml(code, {
    lang: language,
    theme: "vesper",
  });

  // Strip inline background-color from shiki's <pre> so our container bg shows through.
  // CSS can't override inline styles without !important, so we remove it at the source.
  const codeHtml = raw.replace(
    /(<pre\b[^>]+)style="([^"]*)"/,
    (_, pre: string, style: string) =>
      `${pre}style="${style.replace(/background(?:-color)?:[^;]+;?\s*/gi, "")}"`,
  );

  return (
    <div
      className="w-full border border-border-primary bg-bg-input overflow-hidden"
      style={{ borderColor: "#2A2A2A" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between w-full"
        style={{
          height: "40px",
          padding: "0 16px",
          borderBottom: "1px solid #2A2A2A",
        }}
      >
        {meta ? (
          <>
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
                  {meta.rank}
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
                  className={`font-mono font-bold ${meta.scoreColor}`}
                  style={{ fontSize: "13px" }}
                >
                  {meta.score}
                </span>
              </div>
            </div>

            {/* Right: language + lines */}
            <div className="flex items-center" style={{ gap: "12px" }}>
              <span
                className="font-mono text-text-secondary"
                style={{ fontSize: "12px" }}
              >
                {meta.language}
              </span>
              <span
                className="font-mono text-text-tertiary"
                style={{ fontSize: "12px" }}
              >
                {meta.lines} lines
              </span>
            </div>
          </>
        ) : (
          /* Default: traffic-light dots */
          <div className="flex items-center" style={{ gap: "12px" }}>
            <div
              className="w-[10px] h-[10px] rounded-full flex-shrink-0"
              style={{ backgroundColor: "#EF4444" }}
            />
            <div
              className="w-[10px] h-[10px] rounded-full flex-shrink-0"
              style={{ backgroundColor: "#F59E0B" }}
            />
            <div
              className="w-[10px] h-[10px] rounded-full flex-shrink-0"
              style={{ backgroundColor: "#10B981" }}
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div
        className="flex overflow-hidden"
        style={
          maxHeight
            ? { maxHeight: `${maxHeight}px`, overflowY: "auto" }
            : undefined
        }
      >
        {/* Line numbers gutter */}
        <div
          className="flex flex-col items-end bg-bg-surface flex-shrink-0"
          style={{
            width: "40px",
            padding: "12px 10px",
            gap: "6px",
            borderRight: "1px solid #2A2A2A",
          }}
        >
          {lineNums.map((n) => (
            <span
              key={n}
              className="font-mono"
              style={{ fontSize: "13px", lineHeight: "1.6", color: "#4B5563" }}
            >
              {n}
            </span>
          ))}
        </div>

        {/* Shiki-highlighted code */}
        <div
          className="flex-1 overflow-hidden code-block-shiki"
          style={{ padding: "12px" }}
        >
          <div
            // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki outputs pre-escaped HTML
            dangerouslySetInnerHTML={{ __html: codeHtml }}
          />
        </div>
      </div>
    </div>
  );
}
