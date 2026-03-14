import dotenv from "dotenv";

// load .env.local first (used by drizzle config) then fallback to .env
dotenv.config({ path: ".env.local" });
dotenv.config();

import { faker } from "@faker-js/faker";

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

function pick<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  // dynamic import so dotenv runs before the DB client reads env vars
  const { db } = await import("../src/db/client");
  const { analyses, submissions } = await import("../src/db/schema");

  const COUNT = 100;

  const subs = Array.from({ length: COUNT }).map(() => {
    const createdAt = faker.date.recent({ days: 30 });
    return {
      code: faker.lorem.paragraphs({ min: 1, max: 3 }),
      language: pick(LANGS),
      analysisMode: pick(MODES),
      // faker doesn't expose a sha256 helper in the current package version
      // use uuid as a reasonable unique token for the hash columns
      ipHash: faker.string.uuid(),
      userAgentHash: faker.string.uuid(),
      createdAt,
      updatedAt: createdAt,
    } as const;
  });

  try {
    await db.transaction(async (tx) => {
      // Insert submissions and return generated rows (with ids)
      const insertedSubs = await tx
        .insert(submissions)
        .values(subs)
        .returning();

      const analysesRows = (insertedSubs as any[]).map((sub) => {
        const status = pick(STATUSES);
        // handle snake_case returned fields (created_at) or camelCase (createdAt)
        const subCreatedAt = sub.created_at ?? sub.createdAt ?? new Date();
        const createdAt = faker.date.between({
          from: subCreatedAt,
          to: new Date(),
        });
        const completedAt =
          status === "completed"
            ? faker.date.between({ from: createdAt, to: new Date() })
            : null;
        const isFailed = status === "failed";
        const suggestions =
          status === "completed"
            ? JSON.stringify([
                faker.hacker.phrase(),
                faker.hacker.phrase(),
                faker.hacker.phrase(),
              ])
            : null;

        return {
          submissionId: sub.id,
          status,
          score:
            status === "completed"
              ? faker.number.int({ min: 0, max: 100 })
              : null,
          feedback:
            status === "completed"
              ? faker.lorem.sentences({ min: 1, max: 3 })
              : null,
          suggestions,
          diff: faker.lorem.sentence(),
          processingTimeMs: faker.number.int({ min: 20, max: 5000 }),
          errorMessage: isFailed ? faker.lorem.sentence() : null,
          aiModelVersion:
            process.env.AI_MODEL_VERSION ??
            `gpt-${faker.number.int({ min: 3, max: 4 })}.0`,
          createdAt,
          completedAt,
        } as const;
      });

      // insert analyses (no returning needed)
      await tx.insert(analyses).values(analysesRows);
    });

    console.log(`Seeded ${COUNT} submissions and ${COUNT} analyses.`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

main();
