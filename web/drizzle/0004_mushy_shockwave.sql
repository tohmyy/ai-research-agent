CREATE TABLE "channel_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channel_configs_channel_unique" UNIQUE("channel")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "publishing_queue_active_content_idx" ON "publishing_queue" USING btree ("channel_content_id") WHERE "publishing_queue"."status" IN ('queued', 'scheduled', 'publishing');
--> statement-breakpoint
INSERT INTO "channel_configs" ("channel", "enabled", "config") VALUES
	('linkedin', false, '{}'::jsonb),
	('x', false, '{}'::jsonb),
	('newsletter', false, '{}'::jsonb)
ON CONFLICT ("channel") DO NOTHING;