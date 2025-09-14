CREATE TABLE "images" (
	"image_id" serial PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"video_id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slides_url" text,
	"thumbnail_image_id" integer
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"instructor_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"image_id" integer
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"course_id" serial PRIMARY KEY NOT NULL,
	"course_name" text NOT NULL,
	"description" text,
	"image_id" integer,
	"video_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "courses_course_name_unique" UNIQUE("course_name")
);
--> statement-breakpoint
CREATE TABLE "course_instructors" (
	"course_id" integer NOT NULL,
	"instructor_id" integer NOT NULL,
	CONSTRAINT "course_instructors_course_id_instructor_id_pk" PRIMARY KEY("course_id","instructor_id")
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"section_id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_id" integer,
	"video_id" integer
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"chapter_id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_id" integer
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"test_id" serial PRIMARY KEY NOT NULL,
	"chapter_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_id" integer,
	"video_id" integer
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"question_id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"question_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options" (
	"option_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"explanation" text,
	"video_id" integer
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"entry_id" serial PRIMARY KEY NOT NULL,
	"chapter_id" integer NOT NULL,
	"sequence_number" integer NOT NULL,
	"test_id" integer,
	"video_id" integer
);
--> statement-breakpoint
CREATE TABLE "option_images" (
	"option_id" integer NOT NULL,
	"image_id" integer NOT NULL,
	CONSTRAINT "option_images_option_id_image_id_pk" PRIMARY KEY("option_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "option_videos" (
	"option_id" integer NOT NULL,
	"video_id" integer NOT NULL,
	CONSTRAINT "option_videos_option_id_video_id_pk" PRIMARY KEY("option_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "question_images" (
	"question_id" integer NOT NULL,
	"image_id" integer NOT NULL,
	CONSTRAINT "question_images_question_id_image_id_pk" PRIMARY KEY("question_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "question_videos" (
	"question_id" integer NOT NULL,
	"video_id" integer NOT NULL,
	CONSTRAINT "question_videos_question_id_video_id_pk" PRIMARY KEY("question_id","video_id")
);
--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_thumbnail_image_id_images_image_id_fk" FOREIGN KEY ("thumbnail_image_id") REFERENCES "public"."images"("image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_image_id_images_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_image_id_images_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_video_id_videos_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("video_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_instructor_id_instructors_instructor_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("instructor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_image_id_images_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_video_id_videos_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("video_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_section_id_sections_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_image_id_images_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_chapter_id_chapters_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("chapter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_image_id_images_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_video_id_videos_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("video_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_test_id_tests_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("test_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_video_id_videos_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("video_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_chapter_id_chapters_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("chapter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_test_id_tests_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("test_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_video_id_videos_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("video_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_images" ADD CONSTRAINT "option_images_option_id_options_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."options"("option_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_images" ADD CONSTRAINT "option_images_image_id_images_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_videos" ADD CONSTRAINT "option_videos_option_id_options_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."options"("option_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_videos" ADD CONSTRAINT "option_videos_video_id_videos_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("video_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_images" ADD CONSTRAINT "question_images_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_images" ADD CONSTRAINT "question_images_image_id_images_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_videos" ADD CONSTRAINT "question_videos_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_videos" ADD CONSTRAINT "question_videos_video_id_videos_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("video_id") ON DELETE no action ON UPDATE no action;