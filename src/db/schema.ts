import {
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ============== ENUMS ==============

export const analysisMode = pgEnum("analysis_mode", ["serious", "roast"]);

export const programmingLanguage = pgEnum("programming_language", [
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
]);

export const analysisStatus = pgEnum("analysis_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

// ============== TABLES ==============

export const submissions = pgTable(
  "submissions",
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull(),
    language: programmingLanguage().notNull(),
    analysisMode: analysisMode().notNull(),
    ipHash: varchar({ length: 64 }).notNull(),
    userAgentHash: varchar({ length: 64 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("submissions_created_at_idx").on(table.createdAt.desc()),
    index("submissions_ip_hash_idx").on(table.ipHash),
    index("submissions_language_idx").on(table.language),
  ],
);

export const analyses = pgTable(
  "analyses",
  {
    id: uuid().primaryKey().defaultRandom(),
    submissionId: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    status: analysisStatus().notNull().default("pending"),
    score: smallint(),
    feedback: text(),
    suggestions: text(), // JSON array stored as text
    diff: text(),
    processingTimeMs: integer(),
    errorMessage: text(),
    aiModelVersion: varchar({ length: 255 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    completedAt: timestamp(),
  },
  (table) => [
    index("analyses_status_idx").on(table.status),
    index("analyses_score_idx").on(table.score.desc()),
    index("analyses_created_at_idx").on(table.createdAt.desc()),
  ],
);

export const analysisLogs = pgTable(
  "analysis_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    submissionId: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    analysisId: uuid()
      .notNull()
      .references(() => analyses.id, { onDelete: "cascade" }),
    eventType: varchar({ length: 50 }).notNull(),
    data: text(), // JSON metadata stored as text
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("logs_event_type_idx").on(table.eventType),
    index("logs_created_at_idx").on(table.createdAt.desc()),
  ],
);
