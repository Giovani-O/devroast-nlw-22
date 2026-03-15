"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
  type HighlighterGeneric,
} from "shiki/bundle/web";
import { useTRPC } from "@/trpc/client";

// Module-level singleton so all rows share one highlighter instance
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

function scoreColor(score: number): string {
  if (score <= 3) return "text-accent-red";
  if (score <= 5) return "text-accent-orange";
  return "text-accent-blue";
}

function LeaderboardRowSkeleton({ rank }: { rank: number }) {
  return (
    <div
      className="border-b border-border-primary flex items-center"
      style={{ fontSize: "12px", padding: "16px 20px" }}
    >
      <span
        className="font-mono text-text-secondary flex-shrink-0"
        style={{ width: "50px" }}
      >
        {rank}
      </span>
      <span
        className="font-mono flex-shrink-0 bg-bg-elevated animate-pulse"
        style={{ width: "70px", height: "16px" }}
      />
      <span className="flex-1 font-mono flex flex-col gap-1">
        <span className="block bg-bg-elevated animate-pulse h-4 w-3/4" />
        <span className="block bg-bg-elevated animate-pulse h-4 w-1/2" />
      </span>
      <span
        className="font-mono text-text-secondary flex-shrink-0 bg-bg-elevated animate-pulse"
        style={{ width: "100px", height: "16px" }}
      />
    </div>
  );
}

function CodeSnippet({ code, language }: { code: string; language: string }) {
  const lines = code.split("\n");
  const hasMore = lines.length > 3;
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const mountedRef = useRef(false);

  const visibleCode = expanded ? code : lines.slice(0, 3).join("\n");

  // Syntax highlight the visible code with Shiki
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
            h.codeToHtml(visibleCode, { lang: "plaintext", theme: "vesper" }),
          ),
        );
        return;
      }
      if (!mountedRef.current) return;
      setHighlightedHtml(
        stripShikiBg(
          h.codeToHtml(visibleCode, { lang: language, theme: "vesper" }),
        ),
      );
    });

    return () => {
      mountedRef.current = false;
    };
  }, [visibleCode, language]);

  // Detect horizontal overflow to add scrollbar padding
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
    <div className="flex-1 flex flex-col min-w-0">
      <div
        ref={scrollRef}
        className="overflow-x-auto code-block-shiki"
        style={isOverflowing ? { paddingBottom: "10px" } : undefined}
      >
        <div
          className="transition-[max-height] duration-300 ease-in-out"
          style={{
            maxHeight: expanded ? "500px" : "calc(12px * 1.6 * 3 + 6px)",
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
              style={{ fontSize: "12px", lineHeight: "1.6" }}
            >
              {visibleCode}
            </pre>
          )}
        </div>
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="font-mono text-text-tertiary hover:text-text-secondary transition-colors text-left cursor-pointer"
          style={{ fontSize: "11px", marginTop: "2px" }}
        >
          {expanded
            ? "// collapse"
            : `// ...${lines.length - 3} more line${lines.length - 3 === 1 ? "" : "s"}`}
        </button>
      )}
    </div>
  );
}

function LeaderboardRow({
  rank,
  score,
  code,
  language,
  isLast,
}: {
  rank: number;
  score: number;
  code: string;
  language: string;
  isLast: boolean;
}) {
  return (
    <div
      className={`flex items-start hover:bg-bg-surface transition-colors ${isLast ? "" : "border-b border-border-primary"}`}
      style={{ fontSize: "12px", padding: "16px 20px" }}
    >
      <span
        className="font-mono text-text-secondary flex-shrink-0"
        style={{ width: "50px" }}
      >
        {rank}
      </span>
      <span
        className={`font-mono font-bold flex-shrink-0 ${scoreColor(score)}`}
        style={{ width: "70px" }}
      >
        {score}
      </span>
      <CodeSnippet code={code} language={language} />
      <span
        className="font-mono text-text-secondary flex-shrink-0"
        style={{ width: "100px" }}
      >
        {language}
      </span>
    </div>
  );
}

export function HomeLeaderboardClient() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.leaderboard.worstEntries.queryOptions(),
  );

  const entries = data?.entries ?? [];
  const totalAnalyses = data?.totalAnalyses ?? 0;

  // Render skeleton rows while loading to ensure server/client structural match
  if (isLoading) {
    return (
      <>
        <LeaderboardRowSkeleton rank={1} />
        <LeaderboardRowSkeleton rank={2} />
        <LeaderboardRowSkeleton rank={3} />
        <div
          className="flex justify-center border-t border-border-primary"
          style={{ padding: "12px 20px" }}
        >
          <div
            className="font-secondary text-text-tertiary flex items-center gap-1"
            style={{ fontSize: "12px" }}
          >
            <span>{"loading..."}</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {entries.map((entry, i) => (
        <LeaderboardRow
          // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered list from DB
          key={i}
          rank={i + 1}
          score={entry.score}
          code={entry.code}
          language={entry.language}
          isLast={i === entries.length - 1}
        />
      ))}

      {/* Footer Metrics */}
      <div
        className="flex justify-center border-t border-border-primary"
        style={{ padding: "12px 20px" }}
      >
        <div
          className="font-secondary text-text-tertiary flex items-center gap-1"
          style={{ fontSize: "12px" }}
        >
          <span>
            {`showing top ${entries.length} of ${totalAnalyses.toLocaleString()} \u00B7`}
          </span>
          <a
            href="/leaderboard"
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            view full leaderboard &gt;&gt;
          </a>
        </div>
      </div>
    </>
  );
}
