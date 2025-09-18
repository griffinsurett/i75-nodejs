// backend/domains/instructor/instructor.controller.js
const { db } = require("../../config/database");
const {
  instructors,
  images,
  courses,
  courseInstructors,
} = require("../../config/schema");
const { eq, desc } = require("drizzle-orm");
const instructorService = require("./instructor.service");
const mediaManager = require("../../shared/utils/mediaManager");
const BaseController = require("../../shared/utils/baseController");

const TimeUntilDeletion = 60000;

class InstructorController extends BaseController {
  // Schema for all media operations
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
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select({
          instructor_id: instructors.instructorId,
          name: instructors.name,
          bio: instructors.bio,
          image_id: instructors.imageId,
          instructor_image: images.imageUrl,
          image_alt_text: images.altText,
          is_archived: instructors.isArchived,
          archived_at: instructors.archivedAt,
        })
        .from(instructors)
        .leftJoin(images, eq(instructors.imageId, images.imageId))
        .where(eq(instructors.isArchived, showArchived))
        .orderBy(instructors.name);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/instructors/:instructorId - Get single instructor
   */
  async getInstructorById(req, res, next) {
    try {
      const { instructorId } = req.params;

      const result = await db
        .select({
          instructor_id: instructors.instructorId,
          name: instructors.name,
          bio: instructors.bio,
          image_id: instructors.imageId,
          instructor_image: images.imageUrl,
          image_alt_text: images.altText,
          is_archived: instructors.isArchived,
          archived_at: instructors.archivedAt,
        })
        .from(instructors)
        .leftJoin(images, eq(instructors.imageId, images.imageId))
        .where(eq(instructors.instructorId, instructorId));

      if (result.length === 0) {
        this.throwNotFound("Instructor");
      }

      // Get courses for this instructor
      const coursesResult = await instructorService.getInstructorCourses(db, instructorId);
      result[0].courses = coursesResult;

      this.success(res, result[0]);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/instructors/:instructorId/courses - Get courses by instructor
   */
  async getInstructorCourses(req, res, next) {
    try {
      const { instructorId } = req.params;

      // Check if instructor exists
      const instructorExists = await this.checkRelatedCount(
        db,
        instructors,
        instructors.instructorId,
        instructorId
      );

      if (instructorExists === 0) {
        this.throwNotFound("Instructor");
      }

      const result = await instructorService.getInstructorCourses(db, instructorId);
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
        const { name, bio, image_url, alt_text, image_id } = req.body;

        const validatedName = this.validateRequired(name, "Name");

        // Handle image
        const finalImageId = await mediaManager.handleImage(
          tx,
          { image_id, image_url, alt_text },
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
        const { name, bio, image_url, alt_text, image_id } = req.body;

        const existing = await this.getOrThrow(
          tx,
          instructors,
          instructors.instructorId,
          instructorId,
          "Instructor"
        );

        // Handle image update
        const currentImageId = await mediaManager.updateImage(
          tx,
          existing.imageId,
          { image_id, image_url, alt_text },
          this.imageSchema
        );

        const updateFields = { updatedAt: new Date() };
        if (name !== undefined) updateFields.name = name;
        if (bio !== undefined) updateFields.bio = bio;
        if (currentImageId !== existing.imageId) updateFields.imageId = currentImageId;

        const [updated] = await tx
          .update(instructors)
          .set(updateFields)
          .where(eq(instructors.instructorId, instructorId))
          .returning();

        return updated;
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/instructors/:instructorId/archive - Archive instructor
   */
  async archiveInstructor(req, res, next) {
    try {
      const { instructorId } = req.params;
      
      // Check if instructor has active courses
      const courseCount = await this.checkRelatedCount(
        db,
        courseInstructors,
        courseInstructors.instructorId,
        instructorId
      );

      if (courseCount > 0) {
        throw this.createError(
          "Cannot archive instructor with assigned courses. Remove from courses first.",
          400
        );
      }

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
   * DELETE /api/instructors/:instructorId - Delete instructor with cascade
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

        // Use mediaManager for cascade delete
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
      if (result.image) {
        message = "Instructor and associated image scheduled for deletion in 60 seconds.";
      }

      this.success(res, result, message);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/instructors/:instructorId/courses - Assign instructor to courses
   */
  async assignCourses(req, res, next) {
    try {
      const { instructorId } = req.params;
      const { courseIds } = req.body;

      if (!courseIds || !Array.isArray(courseIds)) {
        throw this.createError("courseIds array is required", 400);
      }

      const result = await this.withTransaction(db, async (tx) => {
        // Verify instructor exists
        await this.getOrThrow(
          tx,
          instructors,
          instructors.instructorId,
          instructorId,
          "Instructor"
        );

        // Update course assignments
        await instructorService.updateCourseAssignments(tx, instructorId, courseIds);

        // Return updated course list
        return await instructorService.getInstructorCourses(tx, instructorId);
      });

      this.success(res, result, "Course assignments updated");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new InstructorController();