import { Mistral } from "@mistralai/mistralai";
import type { ContentChunk } from "@mistralai/mistralai/models/components";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { analyses, submissions } from "@/db/schema";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

const SERIOUS_SYSTEM_PROMPT = `You are a professional code reviewer. Analyze the provided code and return a JSON object with this exact shape:
{
  "score": <integer 0-10, where 0 is terrible and 10 is perfect>,
  "feedback": "<one concise sentence summarizing the overall code quality>",
  "suggestions": [
    { "severity": "critical" | "warning" | "good", "title": "<short title>", "description": "<explanation>" }
  ],
  "diff": [
    { "type": "context" | "removed" | "added", "content": "<line content without prefix>" }
  ]
}
Return 2-4 suggestions. The diff should show only the single most impactful improvement, with a few context lines for clarity. Return only the JSON object, no other text.`;

const ROAST_SYSTEM_PROMPT = `You are a savage code roaster who gives brutally sarcastic but technically accurate code reviews. Analyze the provided code and return a JSON object with this exact shape:
{
  "score": <integer 0-10, where 0 is terrible and 10 is perfect>,
  "feedback": "<one savage, funny burn summarizing the overall code quality — make it sting>",
  "suggestions": [
    { "severity": "critical" | "warning" | "good", "title": "<sardonic short title>", "description": "<sarcastic but technically accurate explanation>" }
  ],
  "diff": [
    { "type": "context" | "removed" | "added", "content": "<line content without prefix>" }
  ]
}
Return 2-4 suggestions. The diff should show only the single most impactful improvement. Be sarcastic and funny but the technical feedback must still be accurate. Return only the JSON object, no other text.`;

interface AIResponse {
  score: number;
  feedback: string;
  suggestions: Array<{
    severity: "critical" | "warning" | "good";
    title: string;
    description: string;
  }>;
  diff: Array<{
    type: "context" | "removed" | "added";
    content: string;
  }>;
}

function validateAIResponse(data: unknown): AIResponse {
  if (typeof data !== "object" || data === null) {
    throw new Error("AI response is not an object");
  }
  const obj = data as Record<string, unknown>;

  // score: integer clamped to 0–10
  if (typeof obj.score !== "number") throw new Error("score must be a number");
  const score = Math.max(0, Math.min(10, Math.round(obj.score)));

  // feedback: non-empty string
  if (typeof obj.feedback !== "string" || obj.feedback.trim() === "") {
    throw new Error("feedback must be a non-empty string");
  }

  // suggestions: array of 2–4 items with valid severity
  if (
    !Array.isArray(obj.suggestions) ||
    obj.suggestions.length < 2 ||
    obj.suggestions.length > 4
  ) {
    throw new Error("suggestions must be an array of 2-4 items");
  }
  const VALID_SEVERITIES = ["critical", "warning", "good"] as const;
  for (const s of obj.suggestions) {
    if (typeof s !== "object" || s === null)
      throw new Error("suggestion must be an object");
    const sug = s as Record<string, unknown>;
    if (
      !VALID_SEVERITIES.includes(
        sug.severity as (typeof VALID_SEVERITIES)[number],
      )
    ) {
      throw new Error(`Invalid severity: ${String(sug.severity)}`);
    }
    if (typeof sug.title !== "string")
      throw new Error("suggestion title must be a string");
    if (typeof sug.description !== "string")
      throw new Error("suggestion description must be a string");
  }

  // diff: array (can be empty)
  if (!Array.isArray(obj.diff)) throw new Error("diff must be an array");
  const VALID_DIFF_TYPES = ["context", "removed", "added"] as const;
  for (const d of obj.diff) {
    if (typeof d !== "object" || d === null)
      throw new Error("diff item must be an object");
    const item = d as Record<string, unknown>;
    if (
      !VALID_DIFF_TYPES.includes(item.type as (typeof VALID_DIFF_TYPES)[number])
    ) {
      throw new Error(`Invalid diff type: ${String(item.type)}`);
    }
    if (typeof item.content !== "string")
      throw new Error("diff content must be a string");
  }

  return {
    score,
    feedback: obj.feedback,
    suggestions: obj.suggestions as AIResponse["suggestions"],
    diff: obj.diff as AIResponse["diff"],
  };
}

function extractTextContent(
  content: string | Array<ContentChunk> | null | undefined,
): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (chunk): chunk is Extract<ContentChunk, { type: "text" }> =>
          chunk.type === "text",
      )
      .map((chunk) => chunk.text)
      .join("");
  }
  return "";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Validate shared secret
  const secret = request.headers.get("x-analyze-secret");
  if (
    !process.env.ANALYZE_SECRET ||
    !secret ||
    secret !== process.env.ANALYZE_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let analysisId: string;
  let submissionId: string;
  try {
    const body = (await request.json()) as {
      analysisId?: unknown;
      submissionId?: unknown;
    };
    if (
      typeof body.analysisId !== "string" ||
      typeof body.submissionId !== "string"
    ) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    analysisId = body.analysisId;
    submissionId = body.submissionId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    // 3. Load submission from DB
    const submissionRows = await db
      .select({
        code: submissions.code,
        language: submissions.language,
        analysisMode: submissions.analysisMode,
      })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    const submission = submissionRows[0];
    if (!submission) {
      await db
        .update(analyses)
        .set({ status: "failed", errorMessage: "Submission not found" })
        .where(eq(analyses.id, analysisId));
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    // 4. Update status to processing
    await db
      .update(analyses)
      .set({ status: "processing" })
      .where(eq(analyses.id, analysisId));

    // 5. Build prompt
    const systemPrompt =
      submission.analysisMode === "roast"
        ? ROAST_SYSTEM_PROMPT
        : SERIOUS_SYSTEM_PROMPT;
    const userPrompt = `Language: ${submission.language}\nCode:\n${submission.code}`;

    // 6. Call Mistral API
    const result = await mistral.chat.complete({
      model: "mistral-small-latest",
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const rawContent = extractTextContent(
      result.choices?.[0]?.message?.content,
    );
    if (!rawContent) {
      throw new Error("Empty response from Mistral API");
    }

    // 7. Parse and validate
    const parsed = JSON.parse(rawContent) as unknown;
    const validated = validateAIResponse(parsed);

    // 8. Update analyses row with results
    await db
      .update(analyses)
      .set({
        status: "completed",
        score: validated.score,
        feedback: validated.feedback,
        suggestions: JSON.stringify(validated.suggestions),
        diff: JSON.stringify(validated.diff),
        completedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      })
      .where(eq(analyses.id, analysisId));

    // 9. Trigger leaderboard revalidation
    revalidateTag("leaderboard-stats", "max");
    for (let i = 1; i <= 100; i++) {
      revalidateTag(`leaderboard-page-${i}`, "max");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // 10. On any error: mark as failed
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    try {
      await db
        .update(analyses)
        .set({
          status: "failed",
          errorMessage,
          processingTimeMs: Date.now() - startTime,
        })
        .where(eq(analyses.id, analysisId));
    } catch {
      // best effort
    }
    console.error("Analysis failed:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
