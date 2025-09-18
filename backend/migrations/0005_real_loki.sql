ALTER TABLE "videos" DROP CONSTRAINT "videos_thumbnail_image_id_images_image_id_fk";
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "image_id" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_image_id_images_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN "thumbnail_image_id";