// ==================== config/schema.js ====================
const {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
  foreignKey,
  bigint,
  unique,
} = require("drizzle-orm/pg-core");
const { relations } = require("drizzle-orm");

// Images table
const images = pgTable("images", {
  imageId: serial("image_id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  fileSize: bigint("file_size", { mode: "number" }), // Add this - stores size in bytes
  mimeType: text("mime_type"), // Add this - stores format like 'image/jpeg'
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  purgeAfterAt: timestamp("purge_after_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// Videos table
const videos = pgTable("videos", {
  videoId: serial("video_id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  slidesUrl: text("slides_url"),
  fileSize: bigint("file_size", { mode: "number" }), // Add this
  mimeType: text("mime_type"), // Add this
  imageId: integer("image_id").references(() => images.imageId),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  purgeAfterAt: timestamp("purge_after_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// Instructors table
const instructors = pgTable("instructors", {
  instructorId: serial("instructor_id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  imageId: integer("image_id").references(() => images.imageId),
  // Add archive fields
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  purgeAfterAt: timestamp("purge_after_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// Courses table
const courses = pgTable(
  "courses",
  {
    courseId: serial("course_id").primaryKey(),
    courseName: text("course_name").notNull(),
    description: text("description"),
    imageId: integer("image_id").references(() => images.imageId),
    videoId: integer("video_id").references(() => videos.videoId),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    isArchived: boolean("is_archived").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    purgeAfterAt: timestamp("purge_after_at", { withTimezone: true }),
  },
  (table) => {
    return {
      courseNameUnique: unique().on(table.courseName),
    };
  }
);

// Course instructors junction table
const courseInstructors = pgTable(
  "course_instructors",
  {
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.courseId),
    instructorId: integer("instructor_id")
      .notNull()
      .references(() => instructors.instructorId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.courseId, table.instructorId] }),
    };
  }
);

// Sections table
const sections = pgTable("sections", {
  sectionId: serial("section_id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.courseId),
  title: text("title").notNull(),
  description: text("description"),
  imageId: integer("image_id").references(() => images.imageId),
  videoId: integer("video_id").references(() => videos.videoId),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  purgeAfterAt: timestamp("purge_after_at", { withTimezone: true }),
});

// Chapters table
const chapters = pgTable("chapters", {
  chapterId: serial("chapter_id").primaryKey(),
  sectionId: integer("section_id")
    .notNull()
    .references(() => sections.sectionId),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageId: integer("image_id").references(() => images.imageId),
});

// Tests table
const tests = pgTable("tests", {
  testId: serial("test_id").primaryKey(),
  chapterId: integer("chapter_id")
    .notNull()
    .references(() => chapters.chapterId),
  title: text("title").notNull(),
  description: text("description"),
  imageId: integer("image_id").references(() => images.imageId),
  videoId: integer("video_id").references(() => videos.videoId),
});

// Questions table
const questions = pgTable("questions", {
  questionId: serial("question_id").primaryKey(),
  testId: integer("test_id")
    .notNull()
    .references(() => tests.testId),
  questionText: text("question_text").notNull(),
});

// Options table
const options = pgTable("options", {
  optionId: serial("option_id").primaryKey(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.questionId),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  explanation: text("explanation"),
  videoId: integer("video_id").references(() => videos.videoId),
});

// Entries table
const entries = pgTable("entries", {
  entryId: serial("entry_id").primaryKey(),
  chapterId: integer("chapter_id")
    .notNull()
    .references(() => chapters.chapterId),
  sequenceNumber: integer("sequence_number").notNull(),
  testId: integer("test_id").references(() => tests.testId),
  videoId: integer("video_id").references(() => videos.videoId),
});

// Junction tables
const optionImages = pgTable(
  "option_images",
  {
    optionId: integer("option_id")
      .notNull()
      .references(() => options.optionId),
    imageId: integer("image_id")
      .notNull()
      .references(() => images.imageId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.optionId, table.imageId] }),
    };
  }
);

const optionVideos = pgTable(
  "option_videos",
  {
    optionId: integer("option_id")
      .notNull()
      .references(() => options.optionId),
    videoId: integer("video_id")
      .notNull()
      .references(() => videos.videoId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.optionId, table.videoId] }),
    };
  }
);

const questionImages = pgTable(
  "question_images",
  {
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.questionId),
    imageId: integer("image_id")
      .notNull()
      .references(() => images.imageId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.questionId, table.imageId] }),
    };
  }
);

const questionVideos = pgTable(
  "question_videos",
  {
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.questionId),
    videoId: integer("video_id")
      .notNull()
      .references(() => videos.videoId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.questionId, table.videoId] }),
    };
  }
);

// Relations
const imagesRelations = relations(images, ({ many }) => ({
  courses: many(courses),
  instructors: many(instructors),
  sections: many(sections),
  chapters: many(chapters),
  tests: many(tests),
  videoThumbnails: many(videos),
  optionImages: many(optionImages),
  questionImages: many(questionImages),
}));

const videosRelations = relations(videos, ({ one, many }) => ({
  thumbnailImage: one(images, {
    fields: [videos.imageId],
    references: [images.imageId],
  }),
  courses: many(courses),
  sections: many(sections),
  tests: many(tests),
  options: many(options),
  entries: many(entries),
  optionVideos: many(optionVideos),
  questionVideos: many(questionVideos),
}));

const instructorsRelations = relations(instructors, ({ one, many }) => ({
  image: one(images, {
    fields: [instructors.imageId],
    references: [images.imageId],
  }),
  courseInstructors: many(courseInstructors),
}));

const coursesRelations = relations(courses, ({ one, many }) => ({
  image: one(images, {
    fields: [courses.imageId],
    references: [images.imageId],
  }),
  video: one(videos, {
    fields: [courses.videoId],
    references: [videos.videoId],
  }),
  sections: many(sections),
  courseInstructors: many(courseInstructors),
}));

const courseInstructorsRelations = relations(courseInstructors, ({ one }) => ({
  course: one(courses, {
    fields: [courseInstructors.courseId],
    references: [courses.courseId],
  }),
  instructor: one(instructors, {
    fields: [courseInstructors.instructorId],
    references: [instructors.instructorId],
  }),
}));

const sectionsRelations = relations(sections, ({ one, many }) => ({
  course: one(courses, {
    fields: [sections.courseId],
    references: [courses.courseId],
  }),
  image: one(images, {
    fields: [sections.imageId],
    references: [images.imageId],
  }),
  video: one(videos, {
    fields: [sections.videoId],
    references: [videos.videoId],
  }),
  chapters: many(chapters),
}));

const chaptersRelations = relations(chapters, ({ one, many }) => ({
  section: one(sections, {
    fields: [chapters.sectionId],
    references: [sections.sectionId],
  }),
  image: one(images, {
    fields: [chapters.imageId],
    references: [images.imageId],
  }),
  tests: many(tests),
  entries: many(entries),
}));

const testsRelations = relations(tests, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [tests.chapterId],
    references: [chapters.chapterId],
  }),
  image: one(images, {
    fields: [tests.imageId],
    references: [images.imageId],
  }),
  video: one(videos, {
    fields: [tests.videoId],
    references: [videos.videoId],
  }),
  questions: many(questions),
  entries: many(entries),
}));

const questionsRelations = relations(questions, ({ one, many }) => ({
  test: one(tests, {
    fields: [questions.testId],
    references: [tests.testId],
  }),
  options: many(options),
  questionImages: many(questionImages),
  questionVideos: many(questionVideos),
}));

const optionsRelations = relations(options, ({ one, many }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.questionId],
  }),
  video: one(videos, {
    fields: [options.videoId],
    references: [videos.videoId],
  }),
  optionImages: many(optionImages),
  optionVideos: many(optionVideos),
}));

const entriesRelations = relations(entries, ({ one }) => ({
  chapter: one(chapters, {
    fields: [entries.chapterId],
    references: [chapters.chapterId],
  }),
  test: one(tests, {
    fields: [entries.testId],
    references: [tests.testId],
  }),
  video: one(videos, {
    fields: [entries.videoId],
    references: [videos.videoId],
  }),
}));

// Junction table relations
const optionImagesRelations = relations(optionImages, ({ one }) => ({
  option: one(options, {
    fields: [optionImages.optionId],
    references: [options.optionId],
  }),
  image: one(images, {
    fields: [optionImages.imageId],
    references: [images.imageId],
  }),
}));

const optionVideosRelations = relations(optionVideos, ({ one }) => ({
  option: one(options, {
    fields: [optionVideos.optionId],
    references: [options.optionId],
  }),
  video: one(videos, {
    fields: [optionVideos.videoId],
    references: [videos.videoId],
  }),
}));

const questionImagesRelations = relations(questionImages, ({ one }) => ({
  question: one(questions, {
    fields: [questionImages.questionId],
    references: [questions.questionId],
  }),
  image: one(images, {
    fields: [questionImages.imageId],
    references: [images.imageId],
  }),
}));

const questionVideosRelations = relations(questionVideos, ({ one }) => ({
  question: one(questions, {
    fields: [questionVideos.questionId],
    references: [questions.questionId],
  }),
  video: one(videos, {
    fields: [questionVideos.videoId],
    references: [videos.videoId],
  }),
}));

module.exports = {
  images,
  videos,
  instructors,
  courses,
  courseInstructors,
  sections,
  chapters,
  tests,
  questions,
  options,
  entries,
  optionImages,
  optionVideos,
  questionImages,
  questionVideos,
  imagesRelations,
  videosRelations,
  instructorsRelations,
  coursesRelations,
  courseInstructorsRelations,
  sectionsRelations,
  chaptersRelations,
  testsRelations,
  questionsRelations,
  optionsRelations,
  entriesRelations,
  optionImagesRelations,
  optionVideosRelations,
  questionImagesRelations,
  questionVideosRelations,
};
