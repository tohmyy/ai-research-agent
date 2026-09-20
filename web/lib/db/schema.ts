import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

// --- Better Auth tables (drizzle adapter, provider: "pg") ---
// Schema shape follows Better Auth's documented drizzle adapter conventions.
// See: https://www.better-auth.com/docs/adapters/drizzle

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- Application domain tables (see TDD.md §3 for the full data model) ---

export const contentRequests = pgTable("content_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  rawIdea: text("raw_idea").notNull(),
  targetAudience: text("target_audience").notNull(),
  supportingMaterial: text("supporting_material"),
  sourceUrl: text("source_url"),
  additionalInstructions: text("additional_instructions"),
  // Pipeline state machine — see TDD.md §4.
  status: text("status").notNull().default("submitted"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const researchJobs = pgTable("research_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => contentRequests.id, { onDelete: "cascade" }),
  stage: text("stage"),
  status: text("status").notNull().default("pending"), // pending | running | succeeded | failed
  error: text("error"),
  // Ordered array of { key, label, status, detail, at } — backs the
  // expandable activity timeline in ui-design-spec.md §23.
  steps: jsonb("steps"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => contentRequests.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  author: text("author"),
  publishedAt: timestamp("published_at"),
  rawContent: text("raw_content"),
  cleanedContent: text("cleaned_content"),
  metadata: jsonb("metadata"),
  relevanceScore: real("relevance_score"),
  included: boolean("included").notNull().default(false),
  fetchError: text("fetch_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Embedding dimension must match the chosen Voyage AI model's output
// (voyage-3 / voyage-3-large default to 1024). Update if the model changes.
export const sourceChunks = pgTable("source_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  chunkText: text("chunk_text").notNull(),
  embedding: vector("embedding", { dimensions: 1024 }),
});

export const contentPlans = pgTable("content_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => contentRequests.id, { onDelete: "cascade" }),
  planJson: jsonb("plan_json").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const articleDrafts = pgTable("article_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => contentRequests.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  parentDraftId: uuid("parent_draft_id"),
  variantLabel: text("variant_label"),
  title: text("title"),
  bodyMarkdown: text("body_markdown"),
  // drafted | evaluated | revising | selected | approved | rejected
  status: text("status").notNull().default("drafted"),
  // initial | ai_revision | human_edit — who/what produced this version,
  // shown in the UI's Version History (ui-design-spec.md §54).
  revisionSource: text("revision_source").notNull().default("initial"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const draftSources = pgTable("draft_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  draftId: uuid("draft_id")
    .notNull()
    .references(() => articleDrafts.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  chunkIds: uuid("chunk_ids").array(),
});

export const channelContent = pgTable("channel_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  draftId: uuid("draft_id")
    .notNull()
    .references(() => articleDrafts.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(), // linkedin | x | newsletter
  version: integer("version").notNull().default(1),
  parentContentId: uuid("parent_content_id"),
  // initial | ai_revision | human_edit — same convention as
  // articleDrafts.revisionSource, drives the same Version History UI.
  revisionSource: text("revision_source").notNull().default("initial"),
  subject: text("subject"), // newsletter only
  body: text("body"),
  status: text("status").notNull().default("drafted"),
  evaluationId: uuid("evaluation_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const evaluations = pgTable("evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  draftId: uuid("draft_id").references(() => articleDrafts.id, {
    onDelete: "cascade",
  }),
  channelContentId: uuid("channel_content_id").references(
    () => channelContent.id,
    { onDelete: "cascade" },
  ),
  criterionScores: jsonb("criterion_scores"),
  overallStatus: text("overall_status"), // pass | revise | reject
  unsupportedClaims: jsonb("unsupported_claims"),
  recommendedChanges: text("recommended_changes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetType: text("target_type").notNull(), // article | channel_content
  targetId: uuid("target_id").notNull(),
  decision: text("decision").notNull(), // approve | reject | revise
  reviewerId: text("reviewer_id")
    .notNull()
    .references(() => user.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const publishingQueue = pgTable(
  "publishing_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channelContentId: uuid("channel_content_id")
      .notNull()
      .references(() => channelContent.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    scheduledAt: timestamp("scheduled_at"),
    // queued | scheduled | publishing | published | failed | cancelled
    status: text("status").notNull().default("queued"),
    publishedAt: timestamp("published_at"),
    externalPostId: text("external_post_id"),
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // At most one live (not yet finished) queue row per channel_content —
    // stops a double "Publish Now" click from creating two competing rows.
    uniqueIndex("publishing_queue_active_content_idx")
      .on(table.channelContentId)
      .where(sql`${table.status} IN ('queued', 'scheduled', 'publishing')`),
  ],
);

export const channelConfigs = pgTable("channel_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel: text("channel").notNull().unique(), // linkedin | x | newsletter
  enabled: boolean("enabled").notNull().default(false),
  // Channel-specific credential fields — shape varies per channel (e.g.
  // linkedin: accessToken/authorUrn; x: apiKey/apiSecret/accessToken/
  // accessTokenSecret; newsletter: sendgridApiKey/fromEmail/recipients).
  // Stored as plain text (not encrypted) — accepted simplification for a
  // solo-dev demo with a single trusted user, see BUILD-PLAN.md Phase 7.
  config: jsonb("config").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: text("recipient_id")
    .notNull()
    .references(() => user.id),
  type: text("type").notNull(), // review_ready | published | publish_failed
  targetId: uuid("target_id"),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
