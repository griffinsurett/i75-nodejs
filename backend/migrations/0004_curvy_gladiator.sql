ALTER TABLE "images" ADD COLUMN "file_size" bigint;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "mime_type" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "file_size" bigint;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "mime_type" text;