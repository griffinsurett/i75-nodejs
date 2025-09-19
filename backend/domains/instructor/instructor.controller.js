// ==================== controllers/instructorController.js ====================
const { db } = require("../../config/database");
const {
  instructors,
  images,
  courseInstructors,
  courses,
} = require("../../config/schema");
const { eq, desc } = require("drizzle-orm");
const instructorService = require("./instructor.service");
const mediaManager = require("../../shared/utils/mediaManager");
const BaseController = require("../../shared/utils/baseController");

const TimeUntilDeletion = 60000;

class InstructorController extends BaseController {
  // Schema for media operations
  get mediaSchema() {
    return {
      instructors,
      images,
      courses,
      courseInstructors,
    };
  }

  // Simplified schema for image operations
  get imageSchema() {
    return { images };
  }

  /**
   * GET /api/instructors - Get all instructors with optional archive filter
   */
  async getAllInstructors(req, res, next) {
    try {
      const showArchived =
        String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select()
        .from(instructors)
        .leftJoin(images, eq(instructors.imageId, images.imageId))
        .where(eq(instructors.isArchived, showArchived))
        .orderBy(desc(instructors.createdAt));

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/instructors/:instructorId - Get single instructor with courses
   */
  async getInstructor(req, res, next) {
    try {
      const { instructorId } = req.params;

      const instructorResult = await db
        .select()
        .from(instructors)
        .leftJoin(images, eq(instructors.imageId, images.imageId))
        .where(eq(instructors.instructorId, instructorId));

      if (instructorResult.length === 0) {
        this.throwNotFound("Instructor");
      }

      // Get instructor's courses
      const coursesResult = await db
        .select()
        .from(courses)
        .innerJoin(
          courseInstructors,
          eq(courses.courseId, courseInstructors.courseId)
        )
        .leftJoin(images, eq(courses.imageId, images.imageId))
        .where(eq(courseInstructors.instructorId, instructorId))
        .orderBy(desc(courses.createdAt));

      const instructor = instructorResult[0];
      instructor.instructors.courses = coursesResult;

      this.success(res, instructor);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/instructors/:instructorId/courses - Get courses for an instructor
   */
  async getInstructorCourses(req, res, next) {
    try {
      const { instructorId } = req.params;

      const instructorExists = await this.checkRelatedCount(
        db,
        instructors,
        instructors.instructorId,
        instructorId
      );

      if (instructorExists === 0) {
        this.throwNotFound("Instructor");
      }

      const result = await db
        .select()
        .from(courses)
        .innerJoin(
          courseInstructors,
          eq(courses.courseId, courseInstructors.courseId)
        )
        .leftJoin(images, eq(courses.imageId, images.imageId))
        .where(eq(courseInstructors.instructorId, instructorId))
        .orderBy(desc(courses.createdAt));

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/instructors - Create new instructor
   */
  async createInstructor(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { name, bio, imageId, imageUrl, altText, courseIds } = req.body;

        const validatedName = this.validateRequired(name, "Name");

        const finalImageId = await mediaManager.handleImage(
          tx,
          { image_id: imageId, image_url: imageUrl, alt_text: altText },
          this.imageSchema
        );

        const [instructor] = await tx
          .insert(instructors)
          .values({
            name: validatedName,
            bio: bio || null,
            imageId: finalImageId,
            isArchived: false,
            createdAt: new Date(),
          })
          .returning();

        if (courseIds?.length > 0) {
          await instructorService.linkCourses(
            tx,
            instructor.instructorId,
            courseIds
          );
        }

        return instructor;
      });

      this.success(res, result, null, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PUT /api/instructors/:instructorId - Update instructor
   */
  async updateInstructor(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { instructorId } = req.params;
        const { name, bio, imageId, imageUrl, altText, courseIds } = req.body;

        const existing = await this.getOrThrow(
          tx,
          instructors,
          instructors.instructorId,
          instructorId,
          "Instructor"
        );

        const currentImageId = await mediaManager.updateImage(
          tx,
          existing.imageId,
          { image_id: imageId, image_url: imageUrl, alt_text: altText },
          this.imageSchema
        );

        const updateFields = { updatedAt: new Date() };
        if (name !== undefined) updateFields.name = name;
        if (bio !== undefined) updateFields.bio = bio;
        if (currentImageId !== undefined) updateFields.imageId = currentImageId;

        const [updated] = await tx
          .update(instructors)
          .set(updateFields)
          .where(eq(instructors.instructorId, instructorId))
          .returning();

        if (courseIds !== undefined) {
          await instructorService.updateCourses(tx, instructorId, courseIds);
        }

        return updated;
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/instructors/:instructorId/archive - Archive instructor indefinitely
   */
  async archiveInstructor(req, res, next) {
    try {
      const { instructorId } = req.params;
      const updated = await this.archive(
        db,
        instructors,
        instructors.instructorId,
        instructorId,
        "Instructor"
      );
      this.success(res, updated, "Instructor archived");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/instructors/:instructorId/restore - Restore archived instructor
   */
  async restoreInstructor(req, res, next) {
    try {
      const { instructorId } = req.params;
      const updated = await this.restore(
        db,
        instructors,
        instructors.instructorId,
        instructorId,
        "Instructor"
      );
      this.success(res, updated, "Instructor restored");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/instructors/:instructorId - Delete instructor with automatic cascade
   */
  async deleteInstructor(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { instructorId } = req.params;

        const instructor = await this.getOrThrow(
          tx,
          instructors,
          instructors.instructorId,
          instructorId,
          "Instructor"
        );

        // Check if instructor is assigned to any courses
        const courseCount = await this.checkRelatedCount(
          tx,
          courseInstructors,
          courseInstructors.instructorId,
          instructorId
        );

        if (courseCount > 0) {
          throw this.createError(
            "Cannot delete instructor who is assigned to courses. Remove from courses first.",
            400
          );
        }

        return await mediaManager.deleteWithCascade(
          tx,
          instructor,
          instructors,
          instructors.instructorId,
          instructorId,
          this.mediaSchema,
          TimeUntilDeletion
        );
      });

      let message = "Instructor scheduled for deletion in 60 seconds.";
      const cascaded = [];
      if (result.image) cascaded.push("image");
      if (cascaded.length > 0) {
        message = `Instructor and their exclusive ${cascaded.join(
          " and "
        )} scheduled for deletion in 60 seconds.`;
      }

      this.success(res, result, message);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new InstructorController();
