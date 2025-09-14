const { sql, desc, eq, inArray } = require("drizzle-orm");
const {
  archiveSnapshots,
  // entities
  courses,
  courseInstructors,
  sections,
  chapters,
  tests,
  questions,
  options,
  entries,
  images,
  videos,
  optionImages,
  optionVideos,
  questionImages,
  questionVideos,
  instructors,
} = require("../../config/schema");

/**
 * Inserts a snapshot row into archive_snapshots.
 * action: 'archive' (no TTL) | 'delete' (TTL)
 */
async function insertSnapshot(
  tx,
  { entityType, entityId, action, ttlMinutes, payload }
) {
  const deleteAfter =
    action === "delete" && Number(ttlMinutes) > 0
      ? new Date(Date.now() + Number(ttlMinutes) * 60 * 1000)
      : null;

  const status = action === "delete" ? "pending_delete" : "archived";

  const [row] = await tx
    .insert(archiveSnapshots)
    .values({
      entityType,
      entityId: Number(entityId),
      action,
      status,
      payload,
      deleteAfter,
    })
    .returning({
      archive_id: archiveSnapshots.archiveId,
      status: archiveSnapshots.status,
      delete_after: archiveSnapshots.deleteAfter,
    });

  return row;
}

/** ---------- Payload builders per entity ---------- */

async function buildCoursePayload(tx, courseId) {
  const [course] = await tx
    .select()
    .from(courses)
    .where(eq(courses.courseId, courseId));
  if (!course) return null;

  const links = await tx
    .select()
    .from(courseInstructors)
    .where(eq(courseInstructors.courseId, courseId));

  return { course, courseInstructors: links };
}

async function buildSectionPayload(tx, sectionId) {
  const [section] = await tx
    .select()
    .from(sections)
    .where(eq(sections.sectionId, sectionId));
  if (!section) return null;
  return { section };
}

async function buildChapterPayload(tx, chapterId) {
  const [chapter] = await tx
    .select()
    .from(chapters)
    .where(eq(chapters.chapterId, chapterId));
  if (!chapter) return null;
  return { chapter };
}

async function buildTestPayload(tx, testId) {
  const [test] = await tx.select().from(tests).where(eq(tests.testId, testId));
  if (!test) return null;
  return { test };
}

async function buildEntryPayload(tx, entryId) {
  const [entry] = await tx
    .select()
    .from(entries)
    .where(eq(entries.entryId, entryId));
  if (!entry) return null;
  return { entry };
}

async function buildImagePayload(tx, imageId) {
  const [image] = await tx
    .select()
    .from(images)
    .where(eq(images.imageId, imageId));
  if (!image) return null;
  return { image };
}

async function buildVideoPayload(tx, videoId) {
  const [video] = await tx
    .select()
    .from(videos)
    .where(eq(videos.videoId, videoId));
  if (!video) return null;
  return { video };
}

async function buildInstructorPayload(tx, instructorId) {
  const [inst] = await tx
    .select()
    .from(instructors)
    .where(eq(instructors.instructorId, instructorId));
  if (!inst) return null;
  return { instructor: inst };
}

async function buildOptionPayload(tx, optionId) {
  const [opt] = await tx
    .select()
    .from(options)
    .where(eq(options.optionId, optionId));
  if (!opt) return null;

  const imgs = await tx
    .select()
    .from(optionImages)
    .where(eq(optionImages.optionId, optionId));
  const vids = await tx
    .select()
    .from(optionVideos)
    .where(eq(optionVideos.optionId, optionId));

  return { option: opt, optionImages: imgs, optionVideos: vids };
}

async function buildQuestionPayload(tx, questionId) {
  const [q] = await tx
    .select()
    .from(questions)
    .where(eq(questions.questionId, questionId));
  if (!q) return null;

  const qImgs = await tx
    .select()
    .from(questionImages)
    .where(eq(questionImages.questionId, questionId));
  const qVids = await tx
    .select()
    .from(questionVideos)
    .where(eq(questionVideos.questionId, questionId));

  const opts = await tx
    .select()
    .from(options)
    .where(eq(options.questionId, questionId));
  const optIds = opts.map((o) => o.optionId);
  const oImgs = optIds.length
    ? await tx
        .select()
        .from(optionImages)
        .where(inArray(optionImages.optionId, optIds))
    : [];
  const oVids = optIds.length
    ? await tx
        .select()
        .from(optionVideos)
        .where(inArray(optionVideos.optionId, optIds))
    : [];

  return {
    question: q,
    questionImages: qImgs,
    questionVideos: qVids,
    options: opts,
    optionImages: oImgs,
    optionVideos: oVids,
  };
}

/** ---------- Restore helpers per entity ---------- */

async function restoreCourse(tx, payload) {
  const { course, courseInstructors: links } = payload;
  if (!course) throw new Error("Bad archive payload: missing course");
  // Recreate course with original ID
  await tx.insert(courses).values(course);
  if (links?.length) await tx.insert(courseInstructors).values(links);
}

async function restoreSection(tx, payload) {
  const { section } = payload;
  await tx.insert(sections).values(section);
}

async function restoreChapter(tx, payload) {
  const { chapter } = payload;
  await tx.insert(chapters).values(chapter);
}

async function restoreTest(tx, payload) {
  const { test } = payload;
  await tx.insert(tests).values(test);
}

async function restoreEntry(tx, payload) {
  const { entry } = payload;
  await tx.insert(entries).values(entry);
}

async function restoreImage(tx, payload) {
  const { image } = payload;
  await tx.insert(images).values(image);
}

async function restoreVideo(tx, payload) {
  const { video } = payload;
  await tx.insert(videos).values(video);
}

async function restoreInstructor(tx, payload) {
  const { instructor } = payload;
  await tx.insert(instructors).values(instructor);
}

async function restoreOption(tx, payload) {
  const { option, optionImages: imgs, optionVideos: vids } = payload;
  await tx.insert(options).values(option);
  if (imgs?.length) await tx.insert(optionImages).values(imgs);
  if (vids?.length) await tx.insert(optionVideos).values(vids);
}

async function restoreQuestion(tx, payload) {
  const {
    question,
    questionImages: qImgs,
    questionVideos: qVids,
    options: opts,
    optionImages: oImgs,
    optionVideos: oVids,
  } = payload;
  await tx.insert(questions).values(question);
  if (qImgs?.length) await tx.insert(questionImages).values(qImgs);
  if (qVids?.length) await tx.insert(questionVideos).values(qVids);
  if (opts?.length) await tx.insert(options).values(opts);
  if (oImgs?.length) await tx.insert(optionImages).values(oImgs);
  if (oVids?.length) await tx.insert(optionVideos).values(oVids);
}

/** Dispatch maps */
const builders = {
  course: buildCoursePayload,
  section: buildSectionPayload,
  chapter: buildChapterPayload,
  test: buildTestPayload,
  question: buildQuestionPayload,
  option: buildOptionPayload,
  entry: buildEntryPayload,
  image: buildImagePayload,
  video: buildVideoPayload,
  instructor: buildInstructorPayload,
};

const restorers = {
  course: restoreCourse,
  section: restoreSection,
  chapter: restoreChapter,
  test: restoreTest,
  question: restoreQuestion,
  option: restoreOption,
  entry: restoreEntry,
  image: restoreImage,
  video: restoreVideo,
  instructor: restoreInstructor,
};

module.exports = {
  insertSnapshot,
  builders,
  restorers,
};
