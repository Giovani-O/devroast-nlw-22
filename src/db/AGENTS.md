# Database Guidelines

## Overview

This directory contains the Drizzle ORM schema, database client, and migrations for DevRoast. The database is PostgreSQL 16, accessed via the `postgres.js` driver with Drizzle ORM.

## Directory Structure

```
src/db/
├── AGENTS.md         # This file
├── client.ts         # Database client singleton
├── schema.ts         # Drizzle schema (tables, enums, indexes)
└── migrations/
    ├── 0000_daily_changeling.sql   # Initial migration
    └── meta/
        ├── _journal.json           # Migration journal
        └── 0000_snapshot.json      # Schema snapshot
```

## Database Client (`client.ts`)

- **Driver**: `postgres` (postgres.js) -- NOT `@vercel/postgres` or `pg`
- **ORM adapter**: `drizzle-orm/postgres-js`
- **Casing**: `{ casing: "snake_case" }` -- camelCase TypeScript fields map to snake_case SQL columns automatically
- **Singleton**: Module-level `const db = drizzle(...)` acts as a de facto singleton (Node.js caches module evaluations)
- **Fail-fast**: Throws an `Error` immediately if `DATABASE_URL` is not set
- **No schema passed to drizzle()**: The relational query API (`db.query.*`) is NOT available. Use the SQL-like query builder API (`db.select().from()`) exclusively

```tsx
import { db } from "@/db/client";

// Correct: SQL-like query builder
const results = await db.select().from(submissions).where(eq(submissions.id, id));

// NOT available: relational queries
// const results = await db.query.submissions.findFirst(...)  // Won't work
```

## Schema Patterns (`schema.ts`)

### Enums

Define PostgreSQL enums using `pgEnum()`:

```tsx
export const analysisMode = pgEnum("analysis_mode", ["serious", "roast"]);
export const analysisStatus = pgEnum("analysis_status", ["pending", "processing", "completed", "failed"]);
```

Note: The first argument is the SQL enum name (snake_case), the second is the array of values.

### Tables

Define tables using `pgTable()` with three arguments: name, columns, indexes:

```tsx
export const submissions = pgTable(
  "submissions",
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull(),
    language: programmingLanguage().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    index("submissions_created_at_idx").on(t.createdAt.desc()),
    index("submissions_ip_hash_idx").on(t.ipHash),
  ],
);
```

### Column Conventions

| Pattern | Example |
|---------|---------|
| Primary keys | `uuid().primaryKey().defaultRandom()` (UUID v4 via `gen_random_uuid()`) |
| Foreign keys | `uuid().notNull().references(() => submissions.id, { onDelete: "cascade" })` |
| Timestamps | `timestamp().notNull().defaultNow()` |
| Nullable timestamps | `timestamp()` (for `completedAt`, optional dates) |
| Enums | `enumName().notNull()` (reference the pgEnum variable) |
| Text fields | `text().notNull()` or `text()` (nullable) |
| Short strings | `varchar(N).notNull()` (e.g., varchar(64) for hashes, varchar(255) for model version) |
| Integers | `integer()` or `smallint()` |

### Naming Conventions

- **TypeScript**: camelCase (`analysisMode`, `ipHash`, `submissionId`, `createdAt`)
- **SQL**: snake_case (`analysis_mode`, `ip_hash`, `submission_id`, `created_at`) -- automatic via casing config
- **Table names**: lowercase plural (`submissions`, `analyses`, `analysis_logs`)
- **Index names**: `{table}_{column}_idx` (e.g., `submissions_created_at_idx`)
- **Enum SQL names**: snake_case (`analysis_mode`, `analysis_status`, `programming_language`)

### Current Schema

Three tables exist:

1. **`submissions`** - User code submissions
   - `id` (UUID PK), `code` (text), `language` (enum), `analysisMode` (enum)
   - `ipHash` (varchar 64), `userAgentHash` (varchar 64, nullable)
   - `createdAt`, `updatedAt` (timestamps)
   - Indexes: `createdAt DESC`, `ipHash`, `language`

2. **`analyses`** - AI analysis results
   - `id` (UUID PK), `submissionId` (FK -> submissions, cascade delete)
   - `status` (enum, default "pending"), `score` (smallint, nullable)
   - `feedback`, `suggestions`, `diff`, `errorMessage` (text, nullable)
   - `processingTimeMs` (integer), `aiModelVersion` (varchar 255)
   - `createdAt`, `completedAt` (timestamps)
   - Indexes: `status`, `score DESC`, `createdAt DESC`

3. **`analysisLogs`** - Event log for analysis pipeline
   - `id` (UUID PK), `submissionId` + `analysisId` (FKs, cascade delete)
   - `eventType` (varchar 50), `data` (text, nullable -- JSON as TEXT)
   - `createdAt` (timestamp)
   - Indexes: `eventType`, `createdAt DESC`

## Migrations

### Workflow

```bash
# After modifying schema.ts:
npm run db:generate   # Generate SQL migration from schema diff
npm run db:migrate    # Run migration files against the database

# For development (skip migration files):
npm run db:push       # Push schema directly to database

# Inspect database:
npm run db:studio     # Open Drizzle Studio
```

### Configuration (`drizzle.config.ts`)

- Schema source: `./src/db/schema.ts`
- Migration output: `./src/db/migrations`
- Dialect: `postgresql`
- Casing: `snake_case` (must match `client.ts` config)
- Loads env from `.env.local`
- `verbose: true`, `strict: true`

### Migration File Format

- SQL statements separated by `--> statement-breakpoint` comments
- Enums created first, then tables, then foreign keys, then indexes
- Generated by Drizzle Kit -- do not edit manually

## Query Patterns

### Using ctx.db in tRPC Procedures

tRPC procedures access the database through `ctx.db`:

```tsx
export const leaderboardRouter = createTRPCRouter({
  stats: baseProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.select({ count: count() }).from(submissions);
    return { total: result[0]?.count ?? 0 };
  }),
});
```

### Using db Directly in Utility Functions

The `src/lib/db-utils.ts` file imports `db` directly for reusable query helpers:

```tsx
import { db } from "@/db/client";

export async function getLeaderboard(limit = 10) {
  return db
    .select({ ... })
    .from(analyses)
    .innerJoin(submissions, eq(analyses.submissionId, submissions.id))
    .where(eq(analyses.status, "completed"))
    .orderBy(desc(analyses.score))
    .limit(limit);
}
```

### Common Drizzle Operators

Import from `drizzle-orm`:

```tsx
import { eq, desc, asc, count, avg, and, or, sql } from "drizzle-orm";
```

- `eq(column, value)` - Equality filter
- `desc(column)` / `asc(column)` - Ordering
- `count()` / `avg(column)` - Aggregates (note: `avg()` returns string, parse with `Number()`)
- `sql<Type>` template tag - Raw SQL expressions
- `and(...)` / `or(...)` - Combine conditions

## Seed Script (`scripts/seed.ts`)

- Run via `npm run seed` (uses `tsx` for TypeScript execution)
- Loads `.env.local` via dotenv BEFORE importing the db client
- Uses dynamic imports (`await import(...)`) to ensure env is loaded first
- Generates 100 submissions + 100 analyses using `@faker-js/faker`
- Wrapped in `db.transaction()` for atomicity
- Uses `.returning()` on inserts to get generated UUIDs for foreign keys
- Exits with `process.exit(0)` on success, `process.exit(1)` on failure

## Docker Setup

PostgreSQL runs in Docker via `docker-compose.yml`:

```bash
docker compose up -d    # Start PostgreSQL
docker compose down     # Stop PostgreSQL
```

Default credentials: `devroast` / `devroast_pw` / database `devroast` on port 5432.

Connection string: `postgresql://devroast:devroast_pw@localhost:5432/devroast`
