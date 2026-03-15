"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
  type HighlighterGeneric,
} from "shiki/bundle/web";
import { DiffLine } from "@/components/ui/diff-line";
import { ScoreRing } from "@/components/ui/score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";

// ---------- Types ----------

interface Issue {
  severity: "critical" | "warning" | "good";
  title: string;
  description: string;
}

interface DiffLineData {
  type: "context" | "removed" | "added";
  content: string;
}

// ---------- Helpers ----------

const SEVERITY_COLORS: Record<Issue["severity"], string> = {
  critical: "text-accent-red",
  warning: "text-accent-amber",
  good: "text-accent-green",
};

const SEVERITY_DOT_COLORS: Record<Issue["severity"], string> = {
  critical: "bg-accent-red",
  warning: "bg-accent-amber",
  good: "bg-accent-green",
};

const VERDICT_COLORS: Record<string, { text: string; dot: string }> = {
  dumpster_fire: { text: "text-accent-red", dot: "bg-accent-red" },
  needs_serious_help: { text: "text-accent-red", dot: "bg-accent-red" },
  could_be_worse: { text: "text-accent-amber", dot: "bg-accent-amber" },
  decent_attempt: { text: "text-accent-green", dot: "bg-accent-green" },
  clean_code: { text: "text-accent-green", dot: "bg-accent-green" },
};

const VERDICT_COLORS_DEFAULT = {
  text: "text-text-tertiary",
  dot: "bg-text-tertiary",
};

function getVerdictColors(verdict: string | null): {
  text: string;
  dot: string;
} {
  if (verdict && verdict in VERDICT_COLORS) {
    return VERDICT_COLORS[verdict] as { text: string; dot: string };
  }
  return VERDICT_COLORS_DEFAULT;
}

// ---------- Sub-components ----------

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="flex items-center" style={{ gap: "8px" }}>
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
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="w-full h-px bg-border-primary" />;
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <div
      className="flex-1 flex flex-col border border-border-primary"
      style={{ gap: "12px", padding: "20px" }}
    >
      {/* Severity badge */}
      <div className="flex items-center" style={{ gap: "8px" }}>
        <div
          className={`w-2 h-2 rounded-full ${SEVERITY_DOT_COLORS[issue.severity]}`}
        />
        <span
          className={`font-mono font-medium ${SEVERITY_COLORS[issue.severity]}`}
          style={{ fontSize: "12px" }}
        >
          {issue.severity}
        </span>
      </div>

      {/* Title */}
      <span
        className="font-mono font-medium text-text-primary"
        style={{ fontSize: "13px" }}
      >
        {issue.title}
      </span>

      {/* Description */}
      <p
        className="font-secondary text-text-secondary"
        style={{ fontSize: "12px", lineHeight: "1.5" }}
      >
        {issue.description}
      </p>
    </div>
  );
}

function DiffBlock({ lines }: { lines: DiffLineData[] }) {
  return (
    <div className="w-full border border-border-primary bg-bg-input overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center bg-bg-input border-b border-border-primary"
        style={{ height: "40px", padding: "0 16px" }}
      >
        <span
          className="font-mono font-medium text-text-secondary"
          style={{ fontSize: "12px" }}
        >
          {`your_code.ts \u2192 improved_code.ts`}
        </span>
      </div>

      {/* Diff body */}
      <div className="flex flex-col" style={{ padding: "4px 0" }}>
        {lines.map((line, index) => {
          const prefix =
            line.type === "removed"
              ? "- "
              : line.type === "added"
                ? "+ "
                : "  ";

          return (
            <DiffLine
              // biome-ignore lint/suspicious/noArrayIndexKey: diff lines have no stable id
              key={index}
              variant={line.type}
              className="flex items-center"
              style={{ height: "28px", padding: "0 16px" }}
            >
              <span style={{ width: "20px", flexShrink: 0 }}>{prefix}</span>
              <span>{line.content}</span>
            </DiffLine>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Highlighted Code ----------

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripShikiBg(html: string) {
  return html.replace(
    /(<pre\b[^>]+)style="([^"]*)"/,
    (_: string, pre: string, style: string) =>
      `${pre}style="${style.replace(/background(?:-color)?:[^;]+;?\s*/gi, "")}"`,
  );
}

function HighlightedCode({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const highlighterRef = useRef<HighlighterGeneric<
    BundledLanguage,
    BundledTheme
  > | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      if (!highlighterRef.current) {
        highlighterRef.current = await createHighlighter({
          themes: ["vesper"],
          langs: [],
        });
      }
      if (cancelled) return;

      const h = highlighterRef.current;
      const lang = language as BundledLanguage;
      try {
        await h.loadLanguage(lang);
      } catch {
        try {
          await h.loadLanguage("plaintext");
        } catch {
          // ignore
        }
        if (!cancelled) {
          setHtml(
            stripShikiBg(
              h.codeToHtml(code, { lang: "plaintext", theme: "vesper" }),
            ),
          );
        }
        return;
      }
      if (!cancelled) {
        setHtml(stripShikiBg(h.codeToHtml(code, { lang, theme: "vesper" })));
      }
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="w-full border border-border-primary bg-bg-input overflow-hidden flex">
      {/* Line numbers gutter */}
      <div
        className="bg-bg-surface border-r border-border-primary flex flex-col items-end flex-shrink-0"
        style={{
          width: "44px",
          padding: "20px 8px",
          gap: "0",
          userSelect: "none",
        }}
      >
        {lineNumbers.map((n) => (
          <span
            key={n}
            className="font-mono text-text-tertiary"
            style={{ fontSize: "13px", lineHeight: "1.6", display: "block" }}
          >
            {n}
          </span>
        ))}
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto" style={{ maxHeight: "424px" }}>
        {html ? (
          <div
            // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki outputs pre-escaped HTML
            dangerouslySetInnerHTML={{ __html: html }}
            className="code-block-shiki"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              lineHeight: "1.6",
              padding: "20px",
            }}
          />
        ) : (
          <pre
            className="font-mono text-text-primary"
            style={{
              fontSize: "13px",
              lineHeight: "1.6",
              padding: "20px",
              margin: 0,
            }}
          >
            <code
              // biome-ignore lint/security/noDangerouslySetInnerHtml: escapeHtml sanitises all special chars
              dangerouslySetInnerHTML={{ __html: escapeHtml(code) }}
            />
          </pre>
        )}
      </div>
    </div>
  );
}

// ---------- Loading Skeleton ----------

function RoastResultsSkeleton() {
  return (
    <div className="w-full flex flex-col" style={{ gap: "40px" }}>
      {/* Section 1: Score Hero skeleton */}
      <div className="w-full flex items-center" style={{ gap: "48px" }}>
        <Skeleton className="w-[180px] h-[180px] rounded-full" />
        <div className="flex-1 flex flex-col" style={{ gap: "16px" }}>
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>

      <Divider />

      {/* Section 2: Submission skeleton */}
      <div className="w-full flex flex-col" style={{ gap: "16px" }}>
        <Skeleton className="h-4 w-[160px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>

      <Divider />

      {/* Section 3: Detailed Analysis skeleton */}
      <div className="w-full flex flex-col" style={{ gap: "24px" }}>
        <Skeleton className="h-4 w-[160px]" />
        <div className="w-full flex flex-col" style={{ gap: "20px" }}>
          <div className="w-full flex" style={{ gap: "20px" }}>
            <Skeleton className="flex-1 h-[150px]" />
            <Skeleton className="flex-1 h-[150px]" />
          </div>
          <div className="w-full flex" style={{ gap: "20px" }}>
            <Skeleton className="flex-1 h-[150px]" />
            <Skeleton className="flex-1 h-[150px]" />
          </div>
        </div>
      </div>

      <Divider />

      {/* Section 4: Diff skeleton */}
      <div className="w-full flex flex-col" style={{ gap: "24px" }}>
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>

      <div style={{ height: "60px" }} />
    </div>
  );
}

// ---------- Main Client Component ----------

export function RoastResultsClient({ id }: { id: string }) {
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.analysis.getById.queryOptions(
      { id },
      {
        refetchInterval: (query) => {
          const queryData = query.state.data;
          if (
            !queryData ||
            queryData.status === "pending" ||
            queryData.status === "processing"
          ) {
            return 2000;
          }
          return false;
        },
      },
    ),
  );

  // Initial loading state (query hasn't resolved yet)
  if (data === undefined) {
    return <RoastResultsSkeleton />;
  }

  // Null state — analysis not found
  if (data === null) {
    return (
      <div
        role="alert"
        className="w-full flex flex-col items-center justify-center"
        style={{ gap: "16px", padding: "80px 0" }}
      >
        <span
          className="font-mono font-bold text-accent-red"
          style={{ fontSize: "14px" }}
        >
          {"// error"}
        </span>
        <p
          className="font-secondary text-text-secondary"
          style={{ fontSize: "14px" }}
        >
          analysis not found
        </p>
      </div>
    );
  }

  // Pending / processing — analysis still in progress
  if (data.status === "pending" || data.status === "processing") {
    return <RoastResultsSkeleton />;
  }

  // Failed state
  if (data.status === "failed") {
    return (
      <div
        role="alert"
        className="w-full flex flex-col items-center justify-center"
        style={{ gap: "16px", padding: "80px 0" }}
      >
        <span
          className="font-mono font-bold text-accent-red"
          style={{ fontSize: "14px" }}
        >
          {"// analysis_failed"}
        </span>
        <p
          className="font-secondary text-text-secondary"
          style={{ fontSize: "14px" }}
        >
          {data.errorMessage ?? "something went wrong during analysis"}
        </p>
      </div>
    );
  }

  // Completed state — render full results UI
  const { score, verdict, feedback, suggestions, diff, language, code } = data;
  const lineCount = code.split("\n").length;

  const verdictColors = getVerdictColors(verdict);

  return (
    <div className="w-full flex flex-col" style={{ gap: "40px" }}>
      {/* ── Section 1: Score Hero ── */}
      <div className="w-full flex items-center" style={{ gap: "48px" }}>
        {/* Score Ring */}
        <ScoreRing score={score ?? 0} maxScore={10} size={180} />

        {/* Roast Summary */}
        <div className="flex-1 flex flex-col" style={{ gap: "16px" }}>
          {/* Verdict badge */}
          {verdict && (
            <div className="flex items-center" style={{ gap: "8px" }}>
              <div className={`w-2 h-2 rounded-full ${verdictColors.dot}`} />
              <span
                className={`font-mono font-medium ${verdictColors.text}`}
                style={{ fontSize: "13px" }}
              >
                {`verdict: ${verdict}`}
              </span>
            </div>
          )}

          {/* Feedback / roast quote */}
          {feedback && (
            <p
              className="font-secondary text-text-primary"
              style={{ fontSize: "20px", lineHeight: "1.5" }}
            >
              {feedback}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center" style={{ gap: "16px" }}>
            <span
              className="font-mono text-text-tertiary"
              style={{ fontSize: "12px" }}
            >
              {`lang: ${language}`}
            </span>
            <span
              className="font-mono text-text-tertiary"
              style={{ fontSize: "12px" }}
            >
              {"\u00B7"}
            </span>
            <span
              className="font-mono text-text-tertiary"
              style={{ fontSize: "12px" }}
            >
              {`${lineCount} lines`}
            </span>
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Section 2: Your Submission ── */}
      <div className="w-full flex flex-col" style={{ gap: "16px" }}>
        <SectionTitle label="your_submission" />
        <HighlightedCode code={code} language={language} />
      </div>

      <Divider />

      {/* ── Section 3: Detailed Analysis ── */}
      {suggestions && suggestions.length > 0 && (
        <>
          <div className="w-full flex flex-col" style={{ gap: "24px" }}>
            <SectionTitle label="detailed_analysis" />

            {/* Issues Grid — 2 columns */}
            <div className="w-full grid grid-cols-2" style={{ gap: "20px" }}>
              {(suggestions as Issue[]).map((issue, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: suggestions have no stable id
                <IssueCard key={i} issue={issue} />
              ))}
            </div>
          </div>

          <Divider />
        </>
      )}

      {/* ── Section 4: Suggested Fix ── */}
      {diff && diff.length > 0 && (
        <div className="w-full flex flex-col" style={{ gap: "24px" }}>
          <SectionTitle label="suggested_fix" />
          <DiffBlock lines={diff} />
        </div>
      )}

      {/* Bottom spacer */}
      <div style={{ height: "60px" }} />
    </div>
  );
}
