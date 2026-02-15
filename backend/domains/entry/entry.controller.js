// backend/domains/entry/entry.controller.js
const { db } = require("../../config/database");
const {
  entries,
  chapters,
  sections,
  courses,
  tests,
  videos,
} = require("../../config/schema");
const { eq } = require("drizzle-orm");
const BaseController = require("../../shared/utils/baseController");
const { archiveEntity } = require("../../shared/utils/cascadeDelete");
const { schedulePurge } = require("../../shared/workers/archivePurger");

const TimeUntilDeletion = 60000;

class EntryController extends BaseController {
  /**
   * GET /api/entries - Get all entries with optional archive filter
   */
  async getAllEntries(req, res, next) {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select({
          entry_id: entries.entryId,
          chapter_id: entries.chapterId,
          sequence_number: entries.sequenceNumber,
          test_id: entries.testId,
          video_id: entries.videoId,
          chapter_title: chapters.title,
          section_title: sections.title,
          course_name: courses.courseName,
          test_title: tests.title,
          video_title: videos.title,
        })
        .from(entries)
        .innerJoin(chapters, eq(entries.chapterId, chapters.chapterId))
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(tests, eq(entries.testId, tests.testId))
        .leftJoin(videos, eq(entries.videoId, videos.videoId))
        .where(eq(entries.isArchived, showArchived))
        .orderBy(courses.courseName, sections.title, chapters.chapterNumber, entries.sequenceNumber);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/entries/:entryId - Get single entry
   */
  async getEntryById(req, res, next) {
    try {
      const { entryId } = req.params;

      const result = await db
        .select({
          entry_id: entries.entryId,
          chapter_id: entries.chapterId,
          sequence_number: entries.sequenceNumber,
          test_id: entries.testId,
          video_id: entries.videoId,
          chapter_title: chapters.title,
          section_title: sections.title,
          course_name: courses.courseName,
          test_title: tests.title,
          video_title: videos.title,
        })
        .from(entries)
        .innerJoin(chapters, eq(entries.chapterId, chapters.chapterId))
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(tests, eq(entries.testId, tests.testId))
        .leftJoin(videos, eq(entries.videoId, videos.videoId))
        .where(eq(entries.entryId, entryId));

      if (result.length === 0) {
        this.throwNotFound("Entry");
      }

      this.success(res, result[0]);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/entries - Create entry
   */
  async createEntry(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { chapter_id, sequence_number, test_id, video_id } = req.body;

        if (!chapter_id || sequence_number === undefined) {
          throw this.createError("Chapter ID and sequence number are required", 400);
        }

        if ((!test_id && !video_id) || (test_id && video_id)) {
          throw this.createError("Entry must have either a test_id or video_id, but not both", 400);
        }

        await this.getOrThrow(tx, chapters, chapters.chapterId, chapter_id, "Chapter");

        if (test_id) {
          await this.getOrThrow(tx, tests, tests.testId, test_id, "Test");
        }

        if (video_id) {
          await this.getOrThrow(tx, videos, videos.videoId, video_id, "Video");
        }

        const [entry] = await tx
          .insert(entries)
          .values({
            chapterId: chapter_id,
            sequenceNumber: sequence_number,
            testId: test_id || null,
            videoId: video_id || null,
            isArchived: false,
            createdAt: new Date(),
          })
          .returning();

        return entry;
      });

      this.success(res, result, null, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PUT /api/entries/:entryId - Update entry
   */
  async updateEntry(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { entryId } = req.params;
        const { sequence_number, test_id, video_id } = req.body;

        await this.getOrThrow(tx, entries, entries.entryId, entryId, "Entry");

        if ((!test_id && !video_id) || (test_id && video_id)) {
          throw this.createError("Entry must have either a test_id or video_id, but not both", 400);
        }

        if (test_id) {
          await this.getOrThrow(tx, tests, tests.testId, test_id, "Test");
        }

        if (video_id) {
          await this.getOrThrow(tx, videos, videos.videoId, video_id, "Video");
        }

        const updateFields = { updatedAt: new Date() };
        if (sequence_number !== undefined) updateFields.sequenceNumber = sequence_number;
        if (test_id !== undefined) updateFields.testId = test_id;
        if (video_id !== undefined) updateFields.videoId = video_id;

        const [updated] = await tx
          .update(entries)
          .set(updateFields)
          .where(eq(entries.entryId, entryId))
          .returning();

        return updated;
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/entries/:entryId/archive - Archive entry indefinitely
   */
  async archiveEntry(req, res, next) {
    try {
      const { entryId } = req.params;
      const updated = await this.archive(db, entries, entries.entryId, entryId, "Entry");
      this.success(res, updated, "Entry archived");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/entries/:entryId/restore - Restore archived entry
   */
  async restoreEntry(req, res, next) {
    try {
      const { entryId } = req.params;
      const updated = await this.restore(db, entries, entries.entryId, entryId, "Entry");
      this.success(res, updated, "Entry restored");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/entries/:entryId - Soft delete with countdown
   */
  async deleteEntry(req, res, next) {
    try {
      await this.withTransaction(db, async (tx) => {
        const { entryId } = req.params;

        await this.getOrThrow(tx, entries, entries.entryId, entryId, "Entry");

        await archiveEntity(tx, entries, entries.entryId, entryId, TimeUntilDeletion);
      });

      schedulePurge(TimeUntilDeletion);

      this.success(res, null, "Entry scheduled for deletion in 60 seconds.");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new EntryController();
