// ==================== controllers/instructorController.js ====================
const { db } = require("../../config/database");
const { 
  instructors, 
  images, 
  courses, 
  courseInstructors 
} = require("../../config/schema");
const { eq, desc, count } = require("drizzle-orm");

const instructorController = {
  // Get all instructors
  getAllInstructors: async (req, res, next) => {
    try {
      const result = await db
        .select({
          instructor_id: instructors.instructorId,
          name: instructors.name,
          bio: instructors.bio,
          instructor_image: images.imageUrl,
          image_alt_text: images.altText,
        })
        .from(instructors)
        .leftJoin(images, eq(instructors.imageId, images.imageId))
        .orderBy(instructors.name);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single instructor
  getInstructorById: async (req, res, next) => {
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
        })
        .from(instructors)
        .leftJoin(images, eq(instructors.imageId, images.imageId))
        .where(eq(instructors.instructorId, instructorId));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Instructor not found",
        });
      }

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      next(error);
    }
  },

  // Get courses by instructor
  getInstructorCourses: async (req, res, next) => {
    try {
      const { instructorId } = req.params;

      // Check if instructor exists
      const instructorCheck = await db
        .select({ count: count() })
        .from(instructors)
        .where(eq(instructors.instructorId, instructorId));

      if (instructorCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          message: "Instructor not found",
        });
      }

      const result = await db
        .select({
          course_id: courses.courseId,
          course_name: courses.courseName,
          description: courses.description,
          created_at: courses.createdAt,
          updated_at: courses.updatedAt,
          course_image: images.imageUrl,
        })
        .from(courses)
        .innerJoin(courseInstructors, eq(courses.courseId, courseInstructors.courseId))
        .leftJoin(images, eq(courses.imageId, images.imageId))
        .where(eq(courseInstructors.instructorId, instructorId))
        .orderBy(desc(courses.createdAt));

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new instructor
  createInstructor: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { name, bio, image_url, alt_text } = req.body;

        // Validation
        if (!name) {
          throw new Error("Name is required");
        }

        let image_id = null;
        if (image_url) {
          const imageResult = await tx
            .insert(images)
            .values({
              imageUrl: image_url,
              altText: alt_text,
            })
            .returning({ imageId: images.imageId });
          image_id = imageResult[0].imageId;
        }

        const instructorResult = await tx
          .insert(instructors)
          .values({
            name,
            bio,
            imageId: image_id,
          })
          .returning();

        return instructorResult[0];
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Name is required") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Update instructor
  updateInstructor: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { instructorId } = req.params;
        const { name, bio, image_url, alt_text } = req.body;

        // Check if instructor exists
        const existingInstructor = await tx
          .select()
          .from(instructors)
          .where(eq(instructors.instructorId, instructorId));

        if (existingInstructor.length === 0) {
          throw new Error("Instructor not found");
        }

        // Handle image update
        let image_id = existingInstructor[0].imageId;
        if (image_url) {
          if (image_id) {
            // Update existing image
            await tx
              .update(images)
              .set({
                imageUrl: image_url,
                altText: alt_text,
              })
              .where(eq(images.imageId, image_id));
          } else {
            // Create new image
            const imageResult = await tx
              .insert(images)
              .values({
                imageUrl: image_url,
                altText: alt_text,
              })
              .returning({ imageId: images.imageId });
            image_id = imageResult[0].imageId;
          }
        }

        // Update instructor
        const updateResult = await tx
          .update(instructors)
          .set({
            name,
            bio,
            imageId: image_id,
          })
          .where(eq(instructors.instructorId, instructorId))
          .returning();

        return updateResult[0];
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Instructor not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Delete instructor
  deleteInstructor: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { instructorId } = req.params;

        // Check if instructor is assigned to any courses
        const coursesCheck = await tx
          .select({ count: count() })
          .from(courseInstructors)
          .where(eq(courseInstructors.instructorId, instructorId));

        if (coursesCheck[0].count > 0) {
          throw new Error("Cannot delete instructor who is assigned to courses. Remove from courses first.");
        }

        // Delete instructor
        const deleteResult = await tx
          .delete(instructors)
          .where(eq(instructors.instructorId, instructorId))
          .returning();

        if (deleteResult.length === 0) {
          throw new Error("Instructor not found");
        }

        return deleteResult[0];
      });

      res.json({
        success: true,
        message: "Instructor deleted successfully",
      });
    } catch (error) {
      if (error.message === "Instructor not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("Cannot delete instructor")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

module.exports = instructorController;