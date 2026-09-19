ALTER TABLE "channel_content" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_content" ADD COLUMN "parent_content_id" uuid;--> statement-breakpoint
ALTER TABLE "channel_content" ADD COLUMN "revision_source" text DEFAULT 'initial' NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_content" ADD COLUMN "subject" text;