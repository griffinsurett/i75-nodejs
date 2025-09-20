ALTER TABLE "chapters" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "purge_after_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "updated_at" timestamp with time zone;