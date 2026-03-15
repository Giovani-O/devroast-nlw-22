import { faker } from "@faker-js/faker";

const CODE_SNIPPETS: Record<string, string[]> = {
  javascript: [
    `function add(a, b) { return a + b; }`,
    `const users = data.map(u => u.name);`,
    `async function fetchData() { const res = await fetch(url); return res.json(); }`,
    `for (let i = 0; i < 10; i++) { console.log(i); }`,
  ],
  typescript: [
    `interface User { id: number; name: string; email: string; }
const getUser = (id: number): User => ({ id, name: 'John', email: 'john@example.com' });`,
    `type Result<T> = { success: true; data: T } | { success: false; error: string };`,
  ],
  python: [
    `def add(a, b):
    return a + b`,
    `users = [u['name'] for u in data]`,
    `async def fetch_data():
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()`,
  ],
  java: [
    `public int add(int a, int b) { return a + b; }`,
    `List<String> names = users.stream().map(User::getName).collect(Collectors.toList());`,
  ],
  go: [
    `func add(a, b int) int {
    return a + b
}`,
    `func fetchUser(id string) (*User, error) {
    resp, err := http.Get("/api/users/" + id)
}`,
  ],
  rust: [
    `fn add(a: i32, b: i32) -> i32 {
    a + b
}`,
    `let numbers: Vec<i32> = (1..=10).collect();`,
  ],
  cpp: [
    `int add(int a, int b) { return a + b; }`,
    `std::vector<int> nums = {1, 2, 3, 4, 5};`,
  ],
  csharp: [
    `public int Add(int a, int b) => a + b;`,
    `var names = users.Select(u => u.Name).ToList();`,
  ],
  php: [
    `function add($a, $b) { return $a + $b; }`,
    `$users = array_map(function($u) { return $u['name']; }, $data);`,
  ],
  ruby: [
    `def add(a, b)
  a + b
end`,
    `users = data.map { |u| u[:name] }`,
  ],
  swift: [
    `func add(a: Int, b: Int) -> Int {
    return a + b
}`,
    `let users = data.map { $0.name }`,
  ],
  kotlin: [
    `fun add(a: Int, b: Int): Int = a + b`,
    `val names = users.map { it.name }`,
  ],
  sql: [
    `SELECT * FROM users WHERE id = 1;`,
    `SELECT name, email FROM users ORDER BY created_at DESC;`,
  ],
  html: [
    `<div class="container">
  <h1>Hello World</h1>
  <p>This is a paragraph.</p>
</div>`,
  ],
  css: [
    `.container {
  display: flex;
  justify-content: center;
}`,
  ],
  jsx: [
    `function UserCard({ user }) {
  return (
    <div className="user-card">
      <h2>{user.name}</h2>
    </div>
  );
}`,
  ],
  tsx: [
    `interface Props { user: User; }
export const UserCard: React.FC<Props> = ({ user }) => {
  return <div>{user.name}</div>;
};`,
  ],
  json: [`{"name": "John", "age": 30}`],
  yaml: [
    `users:
  - name: John`,
  ],
  bash: [
    `#!/bin/bash
for i in {1..10}; do
  echo $i
done`,
  ],
};

const SERIOUS_FEEDBACK = [
  "Your code is functional but could benefit from better error handling. Consider adding try-catch blocks around async operations.",
  "Good use of functional programming patterns. The map/reduce approach is clean.",
  "The implementation works but could be more efficient. Consider memoization for better performance.",
  "Your code follows good practices with proper separation of concerns.",
  "The code is readable and well-structured. Consider adding unit tests.",
  "Consider using dependency injection for better testability.",
  "Good variable naming and consistent formatting.",
  "The async/await pattern is used correctly.",
  "Your API implementation is solid. Consider adding rate limiting.",
  "The code demonstrates understanding of core concepts.",
];

const ROAST_FEEDBACK = [
  "This code is so bad even your mother wouldn't accept this pull request. You're using 'var'? Really? It's 2024, not 2010.",
  "I've seen better code written by toddlers with crayons. Synchronous fetching in 2024? Block the main thread why don't you.",
  "This is the programming equivalent of putting tape on a bullet wound.",
  "Your variable naming is a crime against readability. 'x', 'temp', 'data' - be original.",
  "Nested callbacks? Really? We're not in callback hell just for fun.",
  "Congratulations, you've invented your own framework inside a framework.",
  "This code has more SQL injection vulnerabilities than a Penetration Testing for Dummies book.",
  "Type 'any'? Type 'any'?! That's not a type, that's a confession.",
  "Oh look, a 500-line function. Would you like some cognitive complexity with your spaghetti?",
  "Your code would fail a basic code review. And I say this with love.",
];

const SUGGESTIONS = [
  "Add input validation and type checking",
  "Implement error handling with try-catch",
  "Consider using async/await instead of promises",
  "Extract magic numbers into constants",
  "Add unit tests for edge cases",
  "Use TypeScript generics for better type safety",
  "Implement caching for expensive operations",
  "Add logging for debugging purposes",
  "Break down large functions into smaller units",
  "Add JSDoc comments for documentation",
];

const LANGS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "go",
  "rust",
  "cpp",
  "csharp",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "sql",
  "html",
  "css",
  "jsx",
  "tsx",
  "json",
  "yaml",
  "bash",
] as const;

const MODES = ["serious", "roast"] as const;
const STATUSES = ["pending", "processing", "completed", "failed"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateHash(): string {
  return faker.string.alphanumeric(64);
}

function generateCode(language: string): string {
  const snippets = CODE_SNIPPETS[language];
  if (snippets && snippets.length > 0) {
    return pick(snippets);
  }
  return faker.lorem.lines({ min: 2, max: 5 });
}

function generateFeedback(mode: "serious" | "roast"): string {
  if (mode === "roast") {
    return pick(ROAST_FEEDBACK);
  }
  return pick(SERIOUS_FEEDBACK);
}

function generateSuggestions(): string {
  const count = faker.number.int({ min: 2, max: 4 });
  const shuffled = [...SUGGESTIONS].sort(() => 0.5 - Math.random());
  return JSON.stringify(shuffled.slice(0, count));
}

function generateDiff(): string {
  const changes = [
    "+ const improved = value.trim().toLowerCase();",
    "- const old = value;",
    "+ if (!input) return undefined;",
    "+ async function fetchData() {",
    "  try {",
    "+   const result = await process(input);",
    "+   return result;",
    "  } catch (e) {",
    "+   console.error(e);",
    "+   return null;",
    "  }",
    "}",
  ];
  const count = faker.number.int({ min: 3, max: 8 });
  return [...changes]
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .join("\n");
}

async function main() {
  console.log("Starting seed...");

  const { default: dotenv } = await import("dotenv");
  dotenv.config({ path: ".env.local" });
  dotenv.config();

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  const { db } = await import("../src/db/client");
  const { analyses, submissions, analysisLogs } = await import(
    "../src/db/schema"
  );

  const COUNT = 10;
  const COMPLETED_RATIO = 0.7;
  const FAILED_RATIO = 0.1;
  const PROCESSING_RATIO = 0.15;
  const PENDING_RATIO = 0.05;

  const subs = Array.from({ length: COUNT }).map(() => {
    const language = pick(LANGS);
    const createdAt = faker.date.recent({ days: 30 });
    return {
      code: generateCode(language),
      language,
      analysisMode: pick(MODES),
      ipHash: generateHash(),
      userAgentHash: Math.random() > 0.3 ? generateHash() : null,
      createdAt,
      updatedAt: createdAt,
    } as const;
  });

  try {
    await db.transaction(async (tx) => {
      const insertedSubs = await tx
        .insert(submissions)
        .values(subs)
        .returning();

      const analysesRows = insertedSubs.map((sub) => {
        const subAny = sub as Record<string, unknown>;
        const rand = Math.random();
        let status: "pending" | "processing" | "completed" | "failed";

        if (rand < COMPLETED_RATIO) {
          status = "completed";
        } else if (rand < COMPLETED_RATIO + FAILED_RATIO) {
          status = "failed";
        } else if (rand < COMPLETED_RATIO + FAILED_RATIO + PROCESSING_RATIO) {
          status = "processing";
        } else {
          status = "pending";
        }

        const subCreatedAt = (subAny.created_at ?? subAny.createdAt) as
          | Date
          | undefined;
        const analysisCreatedAt = faker.date.between({
          from: subCreatedAt ?? new Date(),
          to: new Date(),
        });

        const completedAt =
          status === "completed"
            ? faker.date.between({ from: analysisCreatedAt, to: new Date() })
            : null;

        const mode = (subAny.analysis_mode ??
          subAny.analysisMode ??
          "serious") as string;
        const isRoast: boolean = mode === "roast";

        return {
          submissionId: sub.id,
          status,
          score:
            status === "completed"
              ? isRoast
                ? faker.number.int({ min: 10, max: 65 })
                : faker.number.int({ min: 50, max: 100 })
              : null,
          feedback:
            status === "completed"
              ? generateFeedback(isRoast ? "roast" : "serious")
              : null,
          suggestions: status === "completed" ? generateSuggestions() : null,
          diff: status === "completed" ? generateDiff() : null,
          processingTimeMs: faker.number.int({ min: 500, max: 8000 }),
          errorMessage: status === "failed" ? faker.lorem.sentence() : null,
          aiModelVersion:
            process.env.AI_MODEL_VERSION ??
            `gpt-${faker.number.int({ min: 4, max: 5 })}o`,
          createdAt: analysisCreatedAt,
          completedAt,
        } as const;
      });

      const insertedAnalyses = await tx
        .insert(analyses)
        .values(analysesRows)
        .returning();

      const logRows = insertedAnalyses
        .filter(() => Math.random() > 0.3)
        .map((analysis) => {
          const analysisAny = analysis as Record<string, unknown>;
          const events = [
            "started",
            "code_received",
            "syntax_checked",
            "analyzed",
          ];

          if (analysis.status === "completed") {
            events.push("completed");
          } else if (analysis.status === "failed") {
            events.push("error");
          }

          const eventType = pick(events);

          return {
            submissionId: (analysisAny.submission_id ??
              analysisAny.submissionId) as string,
            analysisId: analysis.id,
            eventType,
            data: JSON.stringify({
              processingTime: faker.number.int({ min: 100, max: 2000 }),
              language: pick(LANGS),
              ...(eventType === "error" && { error: "Processing failed" }),
            }),
            createdAt: faker.date.between({
              from: (analysisAny.created_at ??
                analysisAny.createdAt ??
                new Date()) as Date,
              to: new Date(),
            }),
          } as const;
        });

      if (logRows.length > 0) {
        await tx.insert(analysisLogs).values(logRows);
      }
    });

    console.log(`Seeded ${COUNT} submissions and ${COUNT} analyses.`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

main();
