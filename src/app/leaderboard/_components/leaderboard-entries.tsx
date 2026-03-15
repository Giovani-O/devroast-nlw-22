"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
  type HighlighterGeneric,
} from "shiki/bundle/web";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Shiki singleton (shared across all cards)
// ---------------------------------------------------------------------------

let highlighterPromise: Promise<
  HighlighterGeneric<BundledLanguage, BundledTheme>
> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({ themes: ["vesper"], langs: [] });
  }
  return highlighterPromise;
}

function stripShikiBg(html: string): string {
  return html.replace(
    /(<pre\b[^>]+)style="([^"]*)"/,
    (_, pre: string, style: string) =>
      `${pre}style="${style.replace(/background(?:-color)?:[^;]+;?\s*/gi, "")}"`,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score <= 33) return "text-accent-red";
  if (score <= 66) return "text-accent-orange";
  return "text-accent-blue";
}

// ---------------------------------------------------------------------------
// CodeSnippet — Shiki-highlighted code with expand/collapse
// ---------------------------------------------------------------------------

function CodeSnippet({ code, language }: { code: string; language: string }) {
  const lines = code.split("\n");
  const hasMore = lines.length > 3;
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const mountedRef = useRef(false);

  const lineNums = Array.from({ length: lines.length }, (_, i) => i + 1);
  const collapsedMaxHeight = "calc(13px * 1.6 * 3 + 6px)";

  // Syntax highlight full code once (CSS max-height handles expand/collapse)
  useEffect(() => {
    mountedRef.current = true;

    getHighlighter().then(async (h) => {
      if (!mountedRef.current) return;
      try {
        await h.loadLanguage(language as Parameters<typeof h.loadLanguage>[0]);
      } catch {
        try {
          await h.loadLanguage("plaintext");
        } catch {
          /* ignore */
        }
        if (!mountedRef.current) return;
        setHighlightedHtml(
          stripShikiBg(
            h.codeToHtml(code, { lang: "plaintext", theme: "vesper" }),
          ),
        );
        return;
      }
      if (!mountedRef.current) return;
      setHighlightedHtml(
        stripShikiBg(h.codeToHtml(code, { lang: language, theme: "vesper" })),
      );
    });

    return () => {
      mountedRef.current = false;
    };
  }, [code, language]);

  // Detect horizontal overflow for scrollbar padding
  // biome-ignore lint/correctness/useExhaustiveDependencies: ResizeObserver handles all DOM changes including expand/collapse
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, highlightedHtml]);

  return (
    <>
      {/* Body */}
      <div
        className="flex"
        style={{ backgroundColor: "var(--color-bg-input)" }}
      >
        {/* Line numbers gutter */}
        <div
          className="flex flex-col items-end bg-bg-input flex-shrink-0 transition-[max-height] duration-300 ease-in-out overflow-hidden"
          style={{
            width: "40px",
            padding: "12px 10px",
            gap: "6px",
            maxHeight: expanded ? "2000px" : collapsedMaxHeight,
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

        {/* Code area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div
            ref={scrollRef}
            className="overflow-x-auto code-block-shiki"
            style={{
              padding: "12px",
              ...(isOverflowing ? { paddingBottom: "22px" } : {}),
            }}
          >
            <div
              className="transition-[max-height] duration-300 ease-in-out"
              style={{
                maxHeight: expanded ? "2000px" : collapsedMaxHeight,
                overflow: "hidden",
              }}
            >
              {highlightedHtml ? (
                <div
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki outputs pre-escaped HTML
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              ) : (
                <pre
                  className="font-mono text-text-primary whitespace-pre"
                  style={{ fontSize: "13px", lineHeight: "1.6" }}
                >
                  {code}
                </pre>
              )}
            </div>
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="font-mono text-text-tertiary hover:text-text-secondary transition-colors text-left cursor-pointer"
              style={{ fontSize: "11px", padding: "0 12px 8px" }}
            >
              {expanded
                ? "// collapse"
                : `// ...${lines.length - 3} more line${lines.length - 3 === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// CodeBlockCard — Full card with header + code body
// ---------------------------------------------------------------------------

function CodeBlockCard({
  rank,
  score,
  code,
  language,
}: {
  rank: number;
  score: number;
  code: string;
  language: string;
}) {
  const lineCount = code.split("\n").length;

  return (
    <div
      className="w-full border border-border-primary overflow-hidden"
      style={{ borderColor: "#2A2A2A" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between w-full bg-bg-page"
        style={{
          height: "40px",
          padding: "0 16px",
        }}
      >
        {/* Left: rank + score */}
        <div className="flex items-center" style={{ gap: "16px" }}>
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
              {rank}
            </span>
          </div>
          <div className="flex items-center" style={{ gap: "6px" }}>
            <span
              className="font-mono text-text-tertiary"
              style={{ fontSize: "12px" }}
            >
              score:
            </span>
            <span
              className={cn("font-mono font-bold", scoreColor(score))}
              style={{ fontSize: "13px" }}
            >
              {score}
            </span>
          </div>
        </div>

        {/* Right: language + lines */}
        <div className="flex items-center" style={{ gap: "12px" }}>
          <span
            className="font-mono text-text-secondary"
            style={{ fontSize: "12px" }}
          >
            {language}
          </span>
          <span
            className="font-mono text-text-tertiary"
            style={{ fontSize: "12px" }}
          >
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>
      </div>

      {/* Code body with line numbers + highlighting */}
      <CodeSnippet code={code} language={language} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card skeleton
// ---------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div
      className="w-full border border-border-primary overflow-hidden"
      style={{ borderColor: "#2A2A2A" }}
    >
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

// ---------------------------------------------------------------------------
// Main export: LeaderboardEntries
// ---------------------------------------------------------------------------

type LeaderboardData = {
  entries: Array<{ code: string; score: number; language: string }>;
  totalCount: number;
  totalPages: number;
};

interface LeaderboardEntriesProps {
  initialData: LeaderboardData;
}

export function LeaderboardEntries({ initialData }: LeaderboardEntriesProps) {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const entriesRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery(
    trpc.leaderboard.paginatedEntries.queryOptions({ page }),
  );

  // Use initialData for page 1 (server-rendered), data for other pages
  const displayData = page === 1 ? initialData : data;
  const entries = displayData?.entries ?? [];
  const totalPages = displayData?.totalPages ?? 1;

  const goToPage = (newPage: number) => {
    setPage(newPage);
    entriesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Show skeleton while loading for pages > 1
  if (isLoading && page > 1) {
    return (
      <div className="w-full flex flex-col" style={{ gap: "20px" }}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        className="font-secondary text-text-tertiary text-center"
        style={{ fontSize: "12px", padding: "40px 0" }}
      >
        {"// no entries yet"}
      </div>
    );
  }

  return (
    <div
      ref={entriesRef}
      className="w-full flex flex-col mb-[60px]"
      style={{ gap: "20px" }}
    >
      {entries.map((entry, i) => (
        <CodeBlockCard
          // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered list from DB query
          key={i}
          rank={(page - 1) * 10 + i + 1}
          score={entry.score}
          code={entry.code}
          language={entry.language}
        />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between"
          style={{ marginTop: "4px" }}
        >
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className={cn(
              "font-mono transition-colors",
              page <= 1
                ? "text-text-muted cursor-default"
                : "text-text-secondary hover:text-text-primary cursor-pointer",
            )}
            style={{ fontSize: "13px" }}
          >
            {"< prev"}
          </button>
          <span
            className="font-secondary text-text-tertiary"
            style={{ fontSize: "12px" }}
          >
            {`page ${page} of ${totalPages}`}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className={cn(
              "font-mono transition-colors",
              page >= totalPages
                ? "text-text-muted cursor-default"
                : "text-text-secondary hover:text-text-primary cursor-pointer",
            )}
            style={{ fontSize: "13px" }}
          >
            {"next >"}
          </button>
        </div>
      )}
    </div>
  );
}
