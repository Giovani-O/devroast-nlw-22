import { TRPCError } from "@trpc/server";
import { and, count, eq, gte } from "drizzle-orm";
import hljs from "highlight.js";
import { z } from "zod/v4";
import { analyses, submissions } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

type ProgrammingLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "go"
  | "rust"
  | "cpp"
  | "csharp"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "sql"
  | "html"
  | "css"
  | "jsx"
  | "tsx"
  | "json"
  | "yaml"
  | "bash";

const LANGUAGE_MAP: Record<string, ProgrammingLanguage> = {
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  python: "python",
  py: "python",
  java: "java",
  go: "go",
  golang: "go",
  rust: "rust",
  rs: "rust",
  cpp: "cpp",
  "c++": "cpp",
  "c/c++": "cpp",
  csharp: "csharp",
  "c#": "csharp",
  cs: "csharp",
  php: "php",
  ruby: "ruby",
  rb: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  kt: "kotlin",
  sql: "sql",
  html: "html",
  xml: "html",
  css: "css",
  jsx: "jsx",
  tsx: "tsx",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  bash: "bash",
  shell: "bash",
  sh: "bash",
  zsh: "bash",
};

function detectLanguage(code: string): ProgrammingLanguage {
  const result = hljs.highlightAuto(code);
  const lang = result.language?.toLowerCase() ?? null;
  if (lang && lang in LANGUAGE_MAP) {
    return LANGUAGE_MAP[lang] as ProgrammingLanguage;
  }
  return "javascript";
}

function deriveVerdict(score: number | null): string | null {
  if (score === null) return null;
  if (score <= 2) return "dumpster_fire";
  if (score <= 4) return "needs_serious_help";
  if (score <= 6) return "could_be_worse";
  if (score <= 8) return "decent_attempt";
  return "clean_code";
}

export const analysisRouter = createTRPCRouter({
  submit: baseProcedure
    .input(
      z.object({
        code: z.string().min(1).max(1000),
        analysisMode: z.enum(["serious", "roast"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Rate limit check
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await ctx.db
        .select({ count: count() })
        .from(submissions)
        .where(
          and(
            eq(submissions.ipHash, ctx.ipHash),
            gte(submissions.createdAt, oneHourAgo),
          ),
        );

      if ((recentCount[0]?.count ?? 0) >= 10) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Try again later.",
        });
      }

      // 2. Detect language
      const detectedLanguage = detectLanguage(input.code);

      // 3. Insert submissions row
      const [submission] = await ctx.db
        .insert(submissions)
        .values({
          code: input.code,
          language: detectedLanguage,
          analysisMode: input.analysisMode,
          ipHash: ctx.ipHash,
          userAgentHash: ctx.userAgentHash ?? undefined,
        })
        .returning({ id: submissions.id });

      if (!submission) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create submission",
        });
      }

      // 4. Insert analyses row
      const [analysis] = await ctx.db
        .insert(analyses)
        .values({
          submissionId: submission.id,
          status: "pending",
          aiModelVersion: process.env.AI_MODEL_VERSION ?? "unknown",
        })
        .returning({ id: analyses.id });

      if (!analysis) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create analysis",
        });
      }

      // 5. Fire-and-forget analyze job
      void fetch(
        `${process.env.APP_URL ?? "http://localhost:3000"}/api/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-analyze-secret": process.env.ANALYZE_SECRET ?? "",
          },
          body: JSON.stringify({
            analysisId: analysis.id,
            submissionId: submission.id,
          }),
        },
      );

      // 6. Return analysisId
      return { analysisId: analysis.id };
    }),

  getById: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          status: analyses.status,
          score: analyses.score,
          feedback: analyses.feedback,
          suggestions: analyses.suggestions,
          diff: analyses.diff,
          errorMessage: analyses.errorMessage,
          createdAt: analyses.createdAt,
          language: submissions.language,
          code: submissions.code,
          analysisMode: submissions.analysisMode,
        })
        .from(analyses)
        .innerJoin(submissions, eq(analyses.submissionId, submissions.id))
        .where(eq(analyses.id, input.id))
        .limit(1);

      if (rows.length === 0) return null;

      const row = rows[0];
      if (!row) return null;

      let parsedSuggestions = null;
      try {
        if (row.suggestions) parsedSuggestions = JSON.parse(row.suggestions);
      } catch (e) {
        console.error("Failed to parse suggestions JSON:", e);
      }

      let parsedDiff = null;
      try {
        if (row.diff) parsedDiff = JSON.parse(row.diff);
      } catch (e) {
        console.error("Failed to parse diff JSON:", e);
      }

      const verdict = deriveVerdict(row.score ?? null);

      return {
        status: row.status,
        score: row.score ?? null,
        verdict,
        feedback: row.feedback ?? null,
        suggestions: parsedSuggestions,
        diff: parsedDiff,
        language: row.language,
        code: row.code,
        analysisMode: row.analysisMode,
        createdAt: row.createdAt.toISOString(),
        errorMessage: row.errorMessage ?? null,
      };
    }),
});
