// Section Controller
const { db } = require("../../config/database");
const {
  sections,
  courses,
  images,
  videos,
  chapters,
} = require("../../config/schema");
const { eq, desc } = require("drizzle-orm");
const mediaManager = require("../../shared/utils/mediaManager");
const BaseController = require("../../shared/utils/baseController");

const TimeUntilDeletion = 60000;

class SectionController extends BaseController {
  // Schema for media operations
  get mediaSchema() {
    return {
      sections,
      courses,
      images,
      videos,
      chapters,
    };
  }

  // Simplified schema for media operations
  get imageVideoSchema() {
    return { images, videos };
  }

  /**
   * GET /api/sections - Get all sections with optional archive filter
   */
  async getAllSections(req, res, next) {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select()
        .from(sections)
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(sections.imageId, images.imageId))
        .leftJoin(videos, eq(sections.videoId, videos.videoId))
        .where(eq(sections.isArchived, showArchived))
        .orderBy(courses.courseName, sections.title);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/sections/:sectionId - Get single section with chapters
   */
  async getSection(req, res, next) {
    try {
      const { sectionId } = req.params;

      const sectionResult = await db
        .select()
        .from(sections)
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(sections.imageId, images.imageId))
        .leftJoin(videos, eq(sections.videoId, videos.videoId))
        .where(eq(sections.sectionId, sectionId));

      if (sectionResult.length === 0) {
        this.throwNotFound("Section");
      }

      // Get section's chapters
      const chaptersResult = await db
        .select()
        .from(chapters)
        .leftJoin(images, eq(chapters.imageId, images.imageId))
        .where(eq(chapters.sectionId, sectionId))
        .orderBy(chapters.chapterNumber);

      const section = sectionResult[0];
      section.sections.chapters = chaptersResult;

      this.success(res, section);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  // Add these methods to the SectionController class:

/**
 * POST /api/sections - Create new section (standalone)
 */
async createSection(req, res, next) {
  try {
    const result = await this.withTransaction(db, async (tx) => {
      const { courseId, title, description, imageId, imageUrl, altText, videoId } = req.body;

      const validatedTitle = this.validateRequired(title, "Section title");
      const validatedCourseId = this.validateRequired(courseId, "Course ID");

      // Verify course exists
      await this.getOrThrow(tx, courses, courses.courseId, validatedCourseId, "Course");

      const finalImageId = await mediaManager.handleImage(
        tx,
        { image_id: imageId, image_url: imageUrl, alt_text: altText },
        this.imageVideoSchema
      );

      const [section] = await tx
        .insert(sections)
        .values({
          courseId: validatedCourseId,
          title: validatedTitle,
          description: description || null,
          imageId: finalImageId,
          videoId: videoId || null,
        })
        .returning();

      return section;
    });

    this.success(res, result, null, 201);
  } catch (error) {
    this.handleError(error, res, next);
  }
}

/**
 * PUT /api/sections/:sectionId - Update section (standalone)
 */
async updateSection(req, res, next) {
  try {
    const result = await this.withTransaction(db, async (tx) => {
      const { sectionId } = req.params;
      const { title, description, imageId, imageUrl, altText, videoId } = req.body;

      const existing = await this.getOrThrow(
        tx,
        sections,
        sections.sectionId,
        sectionId,
        "Section"
      );

      const currentImageId = await mediaManager.updateImage(
        tx,
        existing.imageId,
        { image_id: imageId, image_url: imageUrl, alt_text: altText },
        this.imageVideoSchema
      );

      const updateFields = { updatedAt: new Date() };
      if (title !== undefined) updateFields.title = title;
      if (description !== undefined) updateFields.description = description;
      if (videoId !== undefined) updateFields.videoId = videoId;
      if (currentImageId !== undefined) updateFields.imageId = currentImageId;

      const [updated] = await tx
        .update(sections)
        .set(updateFields)
        .where(eq(sections.sectionId, sectionId))
        .returning();

      return updated;
    });

    this.success(res, result);
  } catch (error) {
    this.handleError(error, res, next);
  }
}

  /**
   * GET /api/sections/:sectionId/chapters - Get chapters for a section
   */
  async getSectionChapters(req, res, next) {
    try {
      const { sectionId } = req.params;

      const sectionExists = await this.checkRelatedCount(
        db,
        sections,
        sections.sectionId,
        sectionId
      );

      if (sectionExists === 0) {
        this.throwNotFound("Section");
      }

      const result = await db
        .select()
        .from(chapters)
        .leftJoin(images, eq(chapters.imageId, images.imageId))
        .where(eq(chapters.sectionId, sectionId))
        .orderBy(chapters.chapterNumber);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/sections/:sectionId/archive - Archive section indefinitely
   */
  async archiveSection(req, res, next) {
    try {
      const { sectionId } = req.params;
      const updated = await this.archive(
        db,
        sections,
        sections.sectionId,
        sectionId,
        "Section"
      );
      this.success(res, updated, "Section archived");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/sections/:sectionId/restore - Restore archived section
   */
  async restoreSection(req, res, next) {
    try {
      const { sectionId } = req.params;
      const updated = await this.restore(
        db,
        sections,
        sections.sectionId,
        sectionId,
        "Section"
      );
      this.success(res, updated, "Section restored");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/sections/:sectionId - Delete section with automatic cascade
   */
  async deleteSection(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { sectionId } = req.params;

        const section = await this.getOrThrow(
          tx,
          sections,
          sections.sectionId,
          sectionId,
          "Section"
        );

        // Check if section has chapters
        const chapterCount = await this.checkRelatedCount(
          tx,
          chapters,
          chapters.sectionId,
          sectionId
        );

        if (chapterCount > 0) {
          throw this.createError(
            "Cannot delete section with existing chapters. Delete chapters first.",
            400
          );
        }

        return await mediaManager.deleteWithCascade(
          tx,
          section,
          sections,
          sections.sectionId,
          sectionId,
          this.mediaSchema,
          TimeUntilDeletion
        );
      });

      let message = "Section scheduled for deletion in 60 seconds.";
      const cascaded = [];
      if (result.image) cascaded.push("image");
      if (result.video) cascaded.push("video");
      if (cascaded.length > 0) {
        message = `Section and its exclusive ${cascaded.join(
          " and "
        )} scheduled for deletion in 60 seconds.`;
      }

      this.success(res, result, message);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new SectionController();