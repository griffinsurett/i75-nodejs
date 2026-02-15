// ==================== controllers/chapterController.js ====================
const { db } = require("../../config/database");
const {
  chapters,
  sections,
  courses,
  images,
  tests,
  entries,
  videos,
  questions,
  options,
  questionImages,
  questionVideos,
} = require("../../config/schema");
const { eq, desc, sql, inArray } = require("drizzle-orm");
const mediaManager = require("../../shared/utils/mediaManager");
const BaseController = require("../../shared/utils/baseController");
const chapterService = require("./chapter.service");

const TimeUntilDeletion = 6000;

class ChapterController extends BaseController {
  constructor() {
    super();
    // Bind all methods to this instance
    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(method => method !== 'constructor' && typeof this[method] === 'function')
      .forEach(method => {
        this[method] = this[method].bind(this);
      });
  }

  // Schema for media operations
  get mediaSchema() {
    return {
      chapters,
      sections,
      courses,
      images,
      tests,
      entries,
    };
  }

  // Simplified schema for image operations
  get imageSchema() {
    return { images };
  }

  /**
   * GET /api/chapters - Get all chapters with optional archive filter
   */
  async getAllChapters(req, res, next) {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select()
        .from(chapters)
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(chapters.imageId, images.imageId))
        .where(eq(chapters.isArchived, showArchived))
        .orderBy(courses.courseName, sections.title, chapters.chapterNumber);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/chapters/:chapterId - Get single chapter with tests and entries
   */
  async getChapterById(req, res, next) {
    try {
      const { chapterId } = req.params;

      const chapterResult = await db
        .select()
        .from(chapters)
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(chapters.imageId, images.imageId))
        .where(eq(chapters.chapterId, chapterId));

      if (chapterResult.length === 0) {
        this.throwNotFound("Chapter");
      }

      // Get chapter's tests
      const testsResult = await db
        .select()
        .from(tests)
        .leftJoin(images, eq(tests.imageId, images.imageId))
        .leftJoin(videos, eq(tests.videoId, videos.videoId))
        .where(eq(tests.chapterId, chapterId))
        .orderBy(tests.title);

      // Get chapter's entries
      const entriesResult = await db
        .select()
        .from(entries)
        .leftJoin(tests, eq(entries.testId, tests.testId))
        .leftJoin(videos, eq(entries.videoId, videos.videoId))
        .where(eq(entries.chapterId, chapterId))
        .orderBy(entries.sequenceNumber);

      const chapter = chapterResult[0];
      chapter.chapters.tests = testsResult;
      chapter.chapters.entries = entriesResult;

      this.success(res, chapter);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/chapters/:chapterId/tests - Get tests for a chapter
   */
  async getChapterTests(req, res, next) {
    try {
      const { chapterId } = req.params;

      const chapterExists = await this.checkRelatedCount(
        db,
        chapters,
        chapters.chapterId,
        chapterId
      );

      if (chapterExists === 0) {
        this.throwNotFound("Chapter");
      }

      const result = await db
        .select()
        .from(tests)
        .leftJoin(images, eq(tests.imageId, images.imageId))
        .leftJoin(videos, eq(tests.videoId, videos.videoId))
        .where(eq(tests.chapterId, chapterId))
        .orderBy(tests.title);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/chapters/:chapterId/entries - Get entries for a chapter
   */
  async getChapterEntries(req, res, next) {
    try {
      const { chapterId } = req.params;

      const chapterExists = await this.checkRelatedCount(
        db,
        chapters,
        chapters.chapterId,
        chapterId
      );

      if (chapterExists === 0) {
        this.throwNotFound("Chapter");
      }

      const result = await db
        .select()
        .from(entries)
        .leftJoin(tests, eq(entries.testId, tests.testId))
        .leftJoin(videos, eq(entries.videoId, videos.videoId))
        .where(eq(entries.chapterId, chapterId))
        .orderBy(entries.sequenceNumber);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/chapters - Create new chapter with sectionId in body
   */
async createChapter(req, res, next) {
  try {
    const result = await this.withTransaction(db, async (tx) => {
      const {
        sectionId,  // Now required in body
        chapterNumber,
        title,
        description,
        content,
        imageId,
        videoId,
      } = req.body;

      // Better validation with clear error message
      if (!sectionId) {
        throw this.createError("Section ID is required", 400);
      }

      const validatedSectionId = parseInt(sectionId, 10);
      if (isNaN(validatedSectionId)) {
        throw this.createError("Invalid Section ID", 400);
      }
      
      // Verify section exists
      await this.getOrThrow(tx, sections, sections.sectionId, validatedSectionId, "Section");

      // Use service to get next chapter number if not provided or if it's 0
      let finalChapterNumber = chapterNumber;
      if (!finalChapterNumber || finalChapterNumber === 0) {
        finalChapterNumber = await chapterService.getNextChapterNumber(tx, validatedSectionId);
      }

      const [chapter] = await tx
        .insert(chapters)
        .values({
          sectionId: validatedSectionId,
          chapterNumber: finalChapterNumber,
          title: title || `Chapter ${finalChapterNumber}`,
          description: description || null,
          content: content || null,
          imageId: imageId || null,
          videoId: videoId || null,
          isArchived: false,
          createdAt: new Date(),
        })
        .returning();

      return chapter;
    });

    this.success(res, result, null, 201);
  } catch (error) {
    this.handleError(error, res, next);
  }
}

  /**
   * PUT /api/chapters/:chapterId - Update chapter
   */
  async updateChapter(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { chapterId } = req.params;
        const {
          chapterNumber,
          title,
          description,
          content,
          imageId,
          videoId,
        } = req.body;

        const existing = await this.getOrThrow(
          tx,
          chapters,
          chapters.chapterId,
          chapterId,
          "Chapter"
        );

        const updateFields = { updatedAt: new Date() };
        if (chapterNumber !== undefined) updateFields.chapterNumber = chapterNumber;
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (content !== undefined) updateFields.content = content;
        if (imageId !== undefined) updateFields.imageId = imageId;
        if (videoId !== undefined) updateFields.videoId = videoId;

        const [updated] = await tx
          .update(chapters)
          .set(updateFields)
          .where(eq(chapters.chapterId, chapterId))
          .returning();

        return updated;
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PUT /api/chapters/sections/:sectionId/reorder - Reorder chapters in a section
   */
  async reorderChapters(req, res, next) {
    try {
      const { sectionId } = req.params;
      const { chapterIds } = req.body;

      if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
        throw this.createError("Chapter IDs array is required", 400);
      }

      await this.withTransaction(db, async (tx) => {
        // Verify section exists
        await this.getOrThrow(tx, sections, sections.sectionId, sectionId, "Section");

        // Verify all chapters belong to this section and update their numbers
        for (let i = 0; i < chapterIds.length; i++) {
          const [chapter] = await tx
            .select()
            .from(chapters)
            .where(eq(chapters.chapterId, chapterIds[i]));
          
          if (!chapter || chapter.sectionId !== parseInt(sectionId)) {
            throw this.createError(`Invalid chapter ID ${chapterIds[i]} for this section`, 400);
          }

          // Update chapter number based on position in array
          await tx
            .update(chapters)
            .set({ 
              chapterNumber: i + 1, 
              updatedAt: new Date() 
            })
            .where(eq(chapters.chapterId, chapterIds[i]));
        }
      });

      this.success(res, null, "Chapters reordered successfully");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/chapters/:chapterId/archive - Archive chapter indefinitely
   */
  async archiveChapter(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { chapterId } = req.params;
        
        // Get chapter details before archiving
        const chapter = await this.getOrThrow(
          tx,
          chapters,
          chapters.chapterId,
          chapterId,
          "Chapter"
        );
        
        // Archive the chapter
        const updated = await this.archive(
          tx,
          chapters,
          chapters.chapterId,
          chapterId,
          "Chapter"
        );
        
        // Renumber remaining chapters in the section
        await chapterService.renumberChapters(tx, chapter.sectionId);
        
        return updated;
      });
      
      this.success(res, result, "Chapter archived and remaining chapters renumbered");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/chapters/:chapterId/restore - Restore archived chapter
   */
  async restoreChapter(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { chapterId } = req.params;
        
        // Get chapter details before restoring
        const chapter = await this.getOrThrow(
          tx,
          chapters,
          chapters.chapterId,
          chapterId,
          "Chapter"
        );
        
        // Remember original number before restore
        const originalNumber = chapter.chapterNumber;

        // Restore the chapter
        const updated = await this.restore(
          tx,
          chapters,
          chapters.chapterId,
          chapterId,
          "Chapter"
        );

        // Get active chapter count (excluding this one, since restore already set isArchived=false)
        const activeChapters = await chapterService.getSectionChapters(tx, chapter.sectionId, false);
        const activeCount = activeChapters.length;

        // Try to restore near original position, clamped to valid range
        const targetNumber = Math.min(originalNumber, activeCount);

        await tx
          .update(chapters)
          .set({
            chapterNumber: targetNumber,
            updatedAt: new Date()
          })
          .where(eq(chapters.chapterId, chapterId));

        // Renumber to resolve any conflicts
        await chapterService.renumberChapters(tx, chapter.sectionId);

        // Re-read to get final number after renumbering
        const [final] = await tx
          .select()
          .from(chapters)
          .where(eq(chapters.chapterId, chapterId));

        updated.chapterNumber = final.chapterNumber;

        return updated;
      });

      this.success(res, result, `Chapter restored as Chapter ${result.chapterNumber}`);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/chapters/:chapterId - Delete chapter with automatic cascade and renumbering
   * If the chapter is already indefinitely archived (no purgeAfterAt), performs a permanent hard delete.
   * Otherwise, soft-deletes with countdown → archive transition.
   */
  async deleteChapter(req, res, next) {
    try {
      const { chapterId } = req.params;

      const chapter = await this.getOrThrow(
        db,
        chapters,
        chapters.chapterId,
        chapterId,
        "Chapter"
      );

      // Already indefinitely archived — permanent hard delete
      if (chapter.isArchived && !chapter.purgeAfterAt) {
        await this.withTransaction(db, async (tx) => {
          // Get all tests belonging to this chapter
          const chapterTests = await tx
            .select({ testId: tests.testId })
            .from(tests)
            .where(eq(tests.chapterId, chapterId));

          const testIds = chapterTests.map(t => t.testId);

          if (testIds.length > 0) {
            // Get all questions belonging to these tests
            const testQuestions = await tx
              .select({ questionId: questions.questionId })
              .from(questions)
              .where(inArray(questions.testId, testIds));

            const questionIds = testQuestions.map(q => q.questionId);

            if (questionIds.length > 0) {
              // Delete question media joins
              await tx.delete(questionImages).where(inArray(questionImages.questionId, questionIds));
              await tx.delete(questionVideos).where(inArray(questionVideos.questionId, questionIds));
              // Delete options
              await tx.delete(options).where(inArray(options.questionId, questionIds));
              // Delete questions
              await tx.delete(questions).where(inArray(questions.testId, testIds));
            }

            // Delete tests
            await tx.delete(tests).where(eq(tests.chapterId, chapterId));
          }

          // Delete entries
          await tx.delete(entries).where(eq(entries.chapterId, chapterId));

          // Delete the chapter itself
          await tx.delete(chapters).where(eq(chapters.chapterId, chapterId));
        });

        return this.success(res, null, "Chapter permanently deleted.");
      }

      // Active or mid-countdown — soft-delete with countdown → archive
      const result = await this.withTransaction(db, async (tx) => {
        const deletedChapter = await mediaManager.deleteWithCascade(
          tx,
          chapter,
          chapters,
          chapters.chapterId,
          chapterId,
          this.mediaSchema,
          TimeUntilDeletion
        );

        // IMPORTANT: Renumber remaining chapters to maintain sequential order
        await chapterService.renumberChapters(tx, chapter.sectionId);

        return deletedChapter;
      });

      let message = "Chapter scheduled for deletion in 60 seconds. Remaining chapters have been renumbered.";
      const cascaded = [];
      if (result.image) cascaded.push("image");
      if (cascaded.length > 0) {
        message = `Chapter and its exclusive ${cascaded.join(
          " and "
        )} scheduled for deletion in 60 seconds. Remaining chapters have been renumbered.`;
      }

      this.success(res, result, message);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new ChapterController();