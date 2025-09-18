ALTER TABLE "instructors" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN "purge_after_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN "updated_at" timestamp with time zone;