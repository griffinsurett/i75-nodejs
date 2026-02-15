ALTER TABLE "tests" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "purge_after_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "purge_after_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "purge_after_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "purge_after_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "content";