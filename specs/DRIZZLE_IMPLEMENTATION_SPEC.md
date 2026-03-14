# Drizzle ORM Implementation Specification

## Project Context

- **Project**: DevRoast - Code Analysis Platform with AI
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database**: PostgreSQL with Docker Compose
- **ORM**: Drizzle ORM v1.x
- **Current State**: No database layer (frontend-only currently)

---

## Overview

This specification outlines the complete implementation plan for integrating Drizzle ORM into the DevRoast project. The database will store:
- **Code Submissions**: User-submitted code snippets
- **Analysis Results**: AI-generated analysis, scores, feedback, and suggestions
- **Leaderboard Data**: Aggregated scoring data for community leaderboard

Anonymous user tracking (no authentication tables required).

---

## Architecture

### Database Structure
```
DevRoast Database (PostgreSQL)
├── Submissions (Code snippets submitted for analysis)
├── Analyses (Analysis results and AI feedback)
├── AnalysisLogs (Audit trail for leaderboard calculations)
└── Enums
    ├── AnalysisMode (serious, roast)
    ├── ProgrammingLanguage (JavaScript, Python, TypeScript, etc.)
    └── AnalysisStatus (pending, completed, failed)
```

### Tech Dependencies
```
drizzle-orm - ORM library
drizzle-kit - Migration & schema management tools
postgres or @vercel/postgres - Database drivers
dotenv - Environment variables
```

---

## Database Schema

### 1. Enums

#### `AnalysisMode`
Available analysis modes for code feedback.

```typescript
export const analysisMode = pgEnum('analysis_mode', ['serious', 'roast']);
```

**Values**:
- `serious` - Constructive, professional analysis
- `roast` - Humorous, critical analysis

#### `ProgrammingLanguage`
Supported programming languages for syntax detection.

```typescript
export const programmingLanguage = pgEnum('programming_language', [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'sql',
  'html',
  'css',
  'jsx',
  'tsx',
  'json',
  'yaml',
  'bash',
]);
```

#### `AnalysisStatus`
Status tracking for analysis operations.

```typescript
export const analysisStatus = pgEnum('analysis_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);
```

### 2. Tables

#### `submissions`
Stores all code submissions from users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT: uuid_generate_v4() | Unique submission identifier |
| `code` | TEXT | NOT NULL | The code snippet submitted |
| `language` | programming_language | NOT NULL | Programming language of the code |
| `analysis_mode` | analysis_mode | NOT NULL | User-selected analysis mode (serious/roast) |
| `ip_hash` | VARCHAR(64) | NOT NULL | Hashed IP for anonymous user tracking |
| `user_agent_hash` | VARCHAR(64) | NULLABLE | Hashed user agent for device tracking |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT: now() | Submission timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT: now() | Last update timestamp |

**Indexes**:
- `created_at DESC` (for recent submissions)
- `ip_hash` (for user tracking)
- `language` (for filtering by language)

**Rationale**:
- `ip_hash` + `user_agent_hash` for anonymous tracking without storing actual IPs
- UUID for secure, non-sequential IDs
- Timestamps for leaderboard sorting and analytics

---

#### `analyses`
Stores AI-generated analysis results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT: uuid_generate_v4() | Unique analysis identifier |
| `submission_id` | UUID | NOT NULL, FOREIGN KEY → submissions(id) ON DELETE CASCADE | Reference to submission |
| `status` | analysis_status | NOT NULL, DEFAULT: 'pending' | Current analysis status |
| `score` | SMALLINT | NULLABLE | Code quality score (0-100) |
| `feedback` | TEXT | NULLABLE | AI-generated feedback |
| `suggestions` | TEXT | NULLABLE | JSON array of improvement suggestions (stored as TEXT) |
| `diff` | TEXT | NULLABLE | Code diff highlighting proposed changes |
| `processing_time_ms` | INTEGER | NULLABLE | Time taken for analysis in milliseconds |
| `error_message` | TEXT | NULLABLE | Error details if analysis failed |
| `ai_model_version` | VARCHAR(255) | NOT NULL | Version of AI model used |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT: now() | Analysis timestamp |
| `completed_at` | TIMESTAMP | NULLABLE | When analysis finished |

**Indexes**:
- `submission_id` (for querying analysis by submission)
- `status` (for filtering pending/failed analyses)
- `score DESC` (for leaderboard)
- `created_at DESC` (for recent analyses)

**Rationale**:
- Separate table for potential async processing
- `status` field allows tracking of pending/failed analyses
- `ai_model_version` for tracking model evolution
- `suggestions` as TEXT for flexibility (can store JSON)
- `processing_time_ms` for performance analytics

---

#### `analysis_logs`
Audit trail for leaderboard calculations and analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT: uuid_generate_v4() | Unique log entry identifier |
| `submission_id` | UUID | NOT NULL, FOREIGN KEY → submissions(id) ON DELETE CASCADE | Reference to submission |
| `analysis_id` | UUID | NOT NULL, FOREIGN KEY → analyses(id) ON DELETE CASCADE | Reference to analysis |
| `event_type` | VARCHAR(50) | NOT NULL | Event type (e.g., 'analysis_completed', 'leaderboard_updated') |
| `data` | TEXT | NULLABLE | JSON event metadata |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT: now() | Log entry timestamp |

**Indexes**:
- `submission_id` (for user history)
- `event_type` (for filtering log types)
- `created_at DESC` (for recent events)

**Rationale**:
- Audit trail for tracking all major events
- Enables debugging and historical analysis
- Foundation for future analytics features

---

## Drizzle Configuration

### Directory Structure
```
project-root/
├── src/
│   ├── db/
│   │   ├── schema.ts          # Table and enum definitions
│   │   ├── client.ts          # Drizzle client initialization
│   │   ├── migrations/        # Generated migrations folder
│   │   └── seed.ts            # (Optional) Database seeding
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/       # API routes for analysis
│   │   ├── actions/           # Server actions (optional)
│   │   └── page.tsx
│   └── lib/
│       └── db-utils.ts        # Helper functions
├── drizzle.config.ts          # Drizzle Kit configuration
├── .env.local                 # Database credentials (local)
├── docker-compose.yml         # PostgreSQL setup
└── package.json
```

### Environment Variables
```env
# Database Connection
DATABASE_URL=postgresql://devroast:devroast_pw@localhost:5432/devroast

# AI Model Version (for tracking)
AI_MODEL_VERSION=1.0.0

# Optional: API Rate Limiting
RATE_LIMIT_SUBMISSIONS_PER_HOUR=50
```

### Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: devroast-postgres
    environment:
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast_pw
      POSTGRES_DB: devroast
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devroast"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - devroast_network

networks:
  devroast_network:
    driver: bridge

volumes:
  postgres_data:
```

---

## Drizzle Schema Definition

### File: `src/db/schema.ts`

```typescript
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  smallint,
  integer,
  timestamp,
  varchar,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';

// ============== ENUMS ==============

export const analysisMode = pgEnum('analysis_mode', ['serious', 'roast']);

export const programmingLanguage = pgEnum('programming_language', [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'sql',
  'html',
  'css',
  'jsx',
  'tsx',
  'json',
  'yaml',
  'bash',
]);

export const analysisStatus = pgEnum('analysis_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

// ============== TABLES ==============

export const submissions = pgTable(
  'submissions',
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
  (table) => ({
    createdAtIdx: index('submissions_created_at_idx').on(
      table.createdAt,
    ).desc(),
    ipHashIdx: index('submissions_ip_hash_idx').on(table.ipHash),
    languageIdx: index('submissions_language_idx').on(table.language),
  }),
);

export const analyses = pgTable(
  'analyses',
  {
    id: uuid().primaryKey().defaultRandom(),
    submissionId: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    status: analysisStatus().notNull().default('pending'),
    score: smallint(),
    feedback: text(),
    suggestions: text(), // JSON array as text
    diff: text(),
    processingTimeMs: integer(),
    errorMessage: text(),
    aiModelVersion: varchar({ length: 255 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    completedAt: timestamp(),
  },
  (table) => ({
    submissionIdIdx: index('analyses_submission_id_idx').on(
      table.submissionId,
    ),
    statusIdx: index('analyses_status_idx').on(table.status),
    scoreIdx: index('analyses_score_idx').on(table.score).desc(),
    createdAtIdx: index('analyses_created_at_idx').on(
      table.createdAt,
    ).desc(),
  }),
);

export const analysisLogs = pgTable(
  'analysis_logs',
  {
    id: uuid().primaryKey().defaultRandom(),
    submissionId: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    analysisId: uuid()
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    eventType: varchar({ length: 50 }).notNull(),
    data: text(), // JSON data as text
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    submissionIdIdx: index('logs_submission_id_idx').on(table.submissionId),
    eventTypeIdx: index('logs_event_type_idx').on(table.eventType),
    createdAtIdx: index('logs_created_at_idx').on(table.createdAt).desc(),
  }),
);

// ============== RELATIONS (optional) ==============

export const submissionsRelations = relations(submissions, ({ many }) => ({
  analyses: many(analyses),
  logs: many(analysisLogs),
}));

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [analyses.submissionId],
    references: [submissions.id],
  }),
  logs: many(analysisLogs),
}));

export const analysisLogsRelations = relations(analysisLogs, ({ one }) => ({
  submission: one(submissions, {
    fields: [analysisLogs.submissionId],
    references: [submissions.id],
  }),
  analysis: one(analyses, {
    fields: [analysisLogs.analysisId],
    references: [analyses.id],
  }),
}));
```

---

## Drizzle Client Setup

### File: `src/db/client.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

### Alternative: Using `@vercel/postgres` (for Vercel deployments)

```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

---

## Drizzle Kit Configuration

### File: `drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

---

## Installation & Setup Steps

### 1. Install Dependencies

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

**OR for Vercel deployment:**

```bash
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit
```

### 2. Environment Setup

Create `.env.local`:
```env
DATABASE_URL=postgresql://devroast:devroast_pw@localhost:5432/devroast
AI_MODEL_VERSION=1.0.0
```

### 3. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

### 4. Generate and Run Migrations

```bash
# Generate initial migration
npx drizzle-kit generate:pg

# Push schema to database
npx drizzle-kit push:pg
```

### 5. Verify Database

```bash
# Optional: Access PostgreSQL
psql -h localhost -U devroast -d devroast

# List tables
\dt
```

---

## API Routes & Server Actions Implementation

### Option A: API Routes

File: `src/app/api/submissions/route.ts`

```typescript
import { db } from '@/db/client';
import { submissions, analyses } from '@/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, language, analysisMode } = body;

    // Hash IP for anonymous tracking
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');

    // Insert submission
    const result = await db.insert(submissions).values({
      code,
      language,
      analysisMode,
      ipHash,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const allSubmissions = await db.query.submissions.findMany({
      limit: 10,
    });
    return NextResponse.json(allSubmissions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
```

### Option B: Server Actions

File: `src/app/actions/submissions.ts`

```typescript
'use server';

import { db } from '@/db/client';
import { submissions, analyses } from '@/db/schema';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function createSubmission({
  code,
  language,
  analysisMode,
}: {
  code: string;
  language: string;
  analysisMode: 'serious' | 'roast';
}) {
  try {
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');

    const result = await db.insert(submissions).values({
      code,
      language,
      analysisMode,
      ipHash,
    }).returning();

    return { success: true, data: result[0] };
  } catch (error) {
    return { success: false, error: 'Failed to create submission' };
  }
}

export async function getRecentSubmissions(limit = 10) {
  try {
    const recentSubmissions = await db.query.submissions.findMany({
      limit,
      orderBy: (submissions, { desc }) => desc(submissions.createdAt),
    });
    return { success: true, data: recentSubmissions };
  } catch (error) {
    return { success: false, error: 'Failed to fetch submissions' };
  }
}
```

---

## Utility Functions

### File: `src/lib/db-utils.ts`

```typescript
import { db } from '@/db/client';
import { submissions, analyses } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

// Get leaderboard (top scores)
export async function getLeaderboard(limit = 10) {
  return db
    .select({
      submissionId: submissions.id,
      language: submissions.language,
      score: analyses.score,
      analysisMode: submissions.analysisMode,
      createdAt: submissions.createdAt,
    })
    .from(analyses)
    .innerJoin(submissions, eq(analyses.submissionId, submissions.id))
    .where(eq(analyses.status, 'completed'))
    .orderBy(desc(analyses.score))
    .limit(limit);
}

// Get analysis by submission ID
export async function getAnalysisBySubmission(submissionId: string) {
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.submissionId, submissionId))
    .then((results) => results[0]);
}

// Get recent submissions by user (using IP hash)
export async function getSubmissionsByUser(ipHash: string, limit = 5) {
  return db
    .select()
    .from(submissions)
    .where(eq(submissions.ipHash, ipHash))
    .orderBy(desc(submissions.createdAt))
    .limit(limit);
}

// Count total submissions
export async function getTotalSubmissions() {
  return db
    .select({ count: sql`count(*)` })
    .from(submissions)
    .then((result) => Number(result[0].count));
}

// Get average score by language
export async function getAverageScoreByLanguage() {
  return db
    .select({
      language: submissions.language,
      avgScore: sql`avg(${analyses.score})`,
      count: sql`count(*)`,
    })
    .from(analyses)
    .innerJoin(submissions, eq(analyses.submissionId, submissions.id))
    .where(eq(analyses.status, 'completed'))
    .groupBy(submissions.language);
}
```

---

## Package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "db:drop": "drizzle-kit drop",
    "db:seed": "node --loader ts-node/esm src/db/seed.ts"
  }
}
```

---

## To-Do Checklist

### Phase 1: Setup & Configuration
- [ ] Install Drizzle ORM and PostgreSQL dependencies
- [ ] Create `.env.local` with `DATABASE_URL`
- [ ] Create `docker-compose.yml` and start PostgreSQL
- [ ] Create `src/db/` directory structure
- [ ] Define schema in `src/db/schema.ts`
- [ ] Set up Drizzle client in `src/db/client.ts`
- [ ] Configure `drizzle.config.ts`
- [ ] Run initial migration (`drizzle-kit generate:pg` and `push:pg`)

### Phase 2: API Integration
- [ ] Implement API routes OR server actions for submissions
- [ ] Create submission endpoints (POST /api/submissions)
- [ ] Create query endpoints (GET /api/submissions)
- [ ] Implement analysis endpoints (POST /api/analyses)
- [ ] Add error handling and validation

### Phase 3: Utility Functions
- [ ] Create leaderboard query function
- [ ] Create submission query functions
- [ ] Create analytics helper functions
- [ ] Add TypeScript types for all queries
- [ ] Document all utility functions

### Phase 4: Frontend Integration
- [ ] Update homepage to call submission API/action
- [ ] Update leaderboard component with database queries
- [ ] Add form validation before submission
- [ ] Handle loading/error states
- [ ] Integrate with AI analysis flow

### Phase 5: Testing & Optimization
- [ ] Write tests for API routes/actions
- [ ] Test database queries with sample data
- [ ] Verify indexes are working (check query plans)
- [ ] Add database seeding for development
- [ ] Performance testing with load data

### Phase 6: Deployment
- [ ] Set up DATABASE_URL in production environment (e.g., Vercel)
- [ ] Run migrations in production
- [ ] Set up automated backups
- [ ] Configure monitoring and logging
- [ ] Document deployment procedures

### Optional Enhancements
- [ ] Add rate limiting to prevent spam
- [ ] Implement caching layer (Redis)
- [ ] Add more detailed audit logging
- [ ] Create admin dashboard for analytics
- [ ] Add data export functionality (CSV/JSON)
- [ ] Implement data retention policies

---

## Migration Management

### Generating Migrations

After modifying `schema.ts`:

```bash
npx drizzle-kit generate:pg
```

This creates timestamped migration files in `src/db/migrations/`.

### Applying Migrations

```bash
# Push to database
npx drizzle-kit push:pg

# Or run specific migrations manually (if needed)
psql -h localhost -U devroast -d devroast < src/db/migrations/[timestamp].sql
```

### Resetting Database (Development Only)

```bash
npx drizzle-kit drop
```

---

## Performance Considerations

### Indexes
All critical query paths have indexes:
- `submissions.createdAt DESC` - for recent submissions
- `submissions.ipHash` - for user tracking
- `analyses.score DESC` - for leaderboard queries
- `analyses.status` - for filtering pending analyses

### Query Optimization
- Use `.limit()` for pagination
- Use `.where()` to filter early
- Use `.select()` to choose only needed columns
- Consider caching for leaderboard queries

### Connection Pooling
For production, use connection pooling:
- PostgreSQL: `max_connections=100`
- Connection pool size: `20-40`

---

## Security Considerations

### Anonymous Tracking
- Hash IPs with SHA-256 before storing
- Never store raw IP addresses
- Hash user agent for device tracking

### SQL Injection Prevention
- Drizzle uses parameterized queries by default ✓
- No raw SQL concatenation

### Rate Limiting
- Implement rate limiting on API routes
- Suggested: 50 submissions per IP per hour

### Data Validation
- Validate code length (max 10,000 characters)
- Validate language against enum values
- Validate analysisMode against enum values

---

## Troubleshooting

### Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -U devroast -d devroast

# Check Docker logs
docker-compose logs postgres
```

### Migration Issues
```bash
# View all migrations
npx drizzle-kit introspect:pg

# Reset and regenerate
npx drizzle-kit drop
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

### Type Errors
```bash
# Regenerate types
npx drizzle-kit introspect:pg
```

---

## References & Resources

- **Drizzle ORM Docs**: https://orm.drizzle.team
- **Drizzle Kit Docs**: https://orm.drizzle.team/kit-docs/overview
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Docker Compose**: https://docs.docker.com/compose/
- **Next.js App Router**: https://nextjs.org/docs/app

---

## Next Steps

1. **Review this spec** - Confirm all entities and fields match your needs
2. **Install dependencies** - Run `npm install` commands from Phase 1
3. **Set up Docker** - Start PostgreSQL with `docker-compose up -d`
4. **Generate migrations** - Run `npx drizzle-kit generate:pg`
5. **Begin Phase 2** - Implement API routes or server actions
6. **Iterate** - Add more features based on feedback

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-14 | Initial Drizzle implementation specification |

