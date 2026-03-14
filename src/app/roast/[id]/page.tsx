import { CodeBlock } from "@/components/ui/code-block";
import { ScoreRing } from "@/components/ui/score-ring";

// ---------- Static mock data (matches Pencil design) ----------

const MOCK_SCORE = 3.5;
const MOCK_VERDICT = "needs_serious_help";
const MOCK_ROAST_QUOTE =
  '"this code looks like it was written during a power outage... in 2005."';
const MOCK_LANG = "javascript";
const MOCK_LINES = 7;

const MOCK_CODE = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`;

interface Issue {
  severity: "critical" | "warning" | "good";
  title: string;
  description: string;
}

const MOCK_ISSUES: Issue[] = [
  {
    severity: "critical",
    title: "using var instead of const/let",
    description:
      "var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
  },
  {
    severity: "warning",
    title: "imperative loop pattern",
    description:
      "for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.",
  },
  {
    severity: "good",
    title: "clear naming conventions",
    description:
      "calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.",
  },
  {
    severity: "good",
    title: "single responsibility",
    description:
      "the function does one thing well \u2014 calculates a total. no side effects, no mixed concerns, no hidden complexity.",
  },
];

interface DiffLine {
  type: "context" | "removed" | "added";
  content: string;
}

const MOCK_DIFF: DiffLine[] = [
  { type: "context", content: "function calculateTotal(items) {" },
  { type: "removed", content: "  var total = 0;" },
  { type: "removed", content: "  for (var i = 0; i < items.length; i++) {" },
  { type: "removed", content: "    total = total + items[i].price;" },
  { type: "removed", content: "  }" },
  { type: "removed", content: "  return total;" },
  {
    type: "added",
    content: "  return items.reduce((sum, item) => sum + item.price, 0);",
  },
  { type: "context", content: "}" },
];

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

function DiffBlock({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="w-full border border-border-primary bg-bg-input overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center bg-bg-input"
        style={{
          height: "40px",
          padding: "0 16px",
          borderBottom: "1px solid var(--color-border-primary)",
        }}
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
        {lines.map((line) => {
          const lineKey = `${line.type}-${line.content}`;
          const prefix =
            line.type === "removed"
              ? "- "
              : line.type === "added"
                ? "+ "
                : "  ";
          const prefixColor =
            line.type === "removed"
              ? "text-accent-red"
              : line.type === "added"
                ? "text-accent-green"
                : "text-text-tertiary";
          const textColor =
            line.type === "removed"
              ? "#EF4444"
              : line.type === "added"
                ? "#10B981"
                : undefined;
          const bgColor =
            line.type === "removed"
              ? "#EF444415"
              : line.type === "added"
                ? "#10B98115"
                : undefined;

          return (
            <div
              key={lineKey}
              className="flex items-center"
              style={{
                height: "28px",
                padding: "0 16px",
                backgroundColor: bgColor,
              }}
            >
              <span
                className={`font-mono ${prefixColor}`}
                style={{ fontSize: "12px", width: "20px", flexShrink: 0 }}
              >
                {prefix}
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: "12px",
                  color: textColor ?? "var(--color-text-primary)",
                }}
              >
                {line.content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Page ----------

export default async function RoastResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // In a real app, fetch roast data by `id` here
  void id;

  return (
    <div className="w-full flex flex-col" style={{ gap: "40px" }}>
      {/* ── Section 1: Score Hero ── */}
      <div className="w-full flex items-center" style={{ gap: "48px" }}>
        {/* Score Ring */}
        <ScoreRing score={MOCK_SCORE} maxScore={10} size={180} />

        {/* Roast Summary */}
        <div className="flex-1 flex flex-col" style={{ gap: "16px" }}>
          {/* Verdict badge */}
          <div className="flex items-center" style={{ gap: "8px" }}>
            <div className="w-2 h-2 rounded-full bg-accent-red" />
            <span
              className="font-mono font-medium text-accent-red"
              style={{ fontSize: "13px" }}
            >
              {`verdict: ${MOCK_VERDICT}`}
            </span>
          </div>

          {/* Roast quote */}
          <p
            className="font-secondary text-text-primary"
            style={{ fontSize: "20px", lineHeight: "1.5" }}
          >
            {MOCK_ROAST_QUOTE}
          </p>

          {/* Meta row */}
          <div className="flex items-center" style={{ gap: "16px" }}>
            <span
              className="font-mono text-text-tertiary"
              style={{ fontSize: "12px" }}
            >
              {`lang: ${MOCK_LANG}`}
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
              {`${MOCK_LINES} lines`}
            </span>
          </div>

          {/* Share button */}
          <div className="flex items-center" style={{ gap: "12px" }}>
            <button
              type="button"
              className="font-mono text-text-primary border border-border-primary hover:bg-bg-elevated transition-colors"
              style={{ fontSize: "12px", padding: "8px 16px" }}
            >
              $ share_roast
            </button>
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Section 2: Your Submission ── */}
      <div className="w-full flex flex-col" style={{ gap: "16px" }}>
        <SectionTitle label="your_submission" />
        <CodeBlock code={MOCK_CODE} language={MOCK_LANG} maxHeight={424} />
      </div>

      <Divider />

      {/* ── Section 3: Detailed Analysis ── */}
      <div className="w-full flex flex-col" style={{ gap: "24px" }}>
        <SectionTitle label="detailed_analysis" />

        {/* Issues Grid — 2×2 */}
        <div className="w-full flex flex-col" style={{ gap: "20px" }}>
          {/* Row 1 */}
          <div className="w-full flex" style={{ gap: "20px" }}>
            <IssueCard issue={MOCK_ISSUES[0]} />
            <IssueCard issue={MOCK_ISSUES[1]} />
          </div>
          {/* Row 2 */}
          <div className="w-full flex" style={{ gap: "20px" }}>
            <IssueCard issue={MOCK_ISSUES[2]} />
            <IssueCard issue={MOCK_ISSUES[3]} />
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Section 4: Suggested Fix ── */}
      <div className="w-full flex flex-col" style={{ gap: "24px" }}>
        <SectionTitle label="suggested_fix" />
        <DiffBlock lines={MOCK_DIFF} />
      </div>

      {/* Bottom spacer */}
      <div style={{ height: "60px" }} />
    </div>
  );
}
