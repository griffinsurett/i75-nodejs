ALTER TABLE "images" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "purge_after_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "purge_after_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "updated_at" timestamp with time zone;