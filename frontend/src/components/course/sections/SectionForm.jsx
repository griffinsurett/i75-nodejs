import { useLocation } from "react-router-dom";
import { sectionAPI, courseAPI } from "../../../services/api";
import { validators } from "../../../utils/forms/validation";
import {
  Form,
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
} from "../../forms";
import MediaInput from "../../media/MediaInput";

export default function SectionForm({ mode = "create", section }) {
  const location = useLocation();
  const isEdit = mode === "edit";

  // Get courseId from URL params when creating new section
  const urlParams = new URLSearchParams(location.search);
  const courseIdFromUrl = urlParams.get("courseId");
  const hasPresetCourse = !isEdit && Boolean(courseIdFromUrl);

  // Build validation object conditionally
  const validation = {
    title: validators.compose(
      validators.required("Section title is required"),
      validators.minLength(3, "Title must be at least 3 characters")
    ),
    description: validators.maxLength(
      500,
      "Description must be less than 500 characters"
    ),
  };

  // Only add courseId validation when needed
  if (!isEdit && !hasPresetCourse) {
    validation.courseId = validators.required("Please select a course");
  }

  // Load initial data
  const loadData = async () => {
    let formData = {
      courseId: courseIdFromUrl || "",
      title: "",
      description: "",
      imageId: null,
      videoId: null,
    };

    let courseName = "";
    let courses = [];

    if (isEdit && section) {
      const sectionData = section.sections || section;
      formData = {
        courseId: String(sectionData.courseId || ""),
        title: sectionData.title || "",
        description: sectionData.description || "",
        imageId: sectionData.imageId || null,
        videoId: sectionData.videoId || null,
      };

      // Get course name for edit mode
      if (section.courses) {
        courseName = section.courses.courseName;
      }
    }

    // Fetch course info based on context
    if (hasPresetCourse && courseIdFromUrl) {
      const courseRes = await courseAPI.getCourse(courseIdFromUrl);
      const courseData = courseRes.data?.data?.courses || courseRes.data?.data;
      courseName = courseData.courseName;
    } else if (!isEdit && !hasPresetCourse) {
      const coursesRes = await courseAPI.getAllCourses();
      courses = coursesRes.data?.data || [];
    }

    return { formData, courseName, courses };
  };

  // Handle submission
  const handleSubmit = async (values) => {
    const finalCourseId = isEdit
      ? section?.sections?.courseId || section?.courseId
      : values.courseId || courseIdFromUrl;

    if (!isEdit && !finalCourseId) {
      throw new Error("Course ID is required");
    }

    if (!isEdit) {
      const courseIdNum = parseInt(finalCourseId);
      if (isNaN(courseIdNum)) {
        throw new Error("Invalid course ID");
      }

      const res = await courseAPI.createCourseSection(courseIdNum, values);
      const id = res.data?.data?.sectionId;
      return { navigateTo: `/courses/${finalCourseId}` };
    } else {
      const sectionData = section.sections || section;
      const id = sectionData.sectionId;
      const courseId = sectionData.courseId || values.courseId;

      await sectionAPI.updateSection(id, values);
      return { navigateTo: `/courses/${courseId}/sections/${id}` };
    }
  };

  // Transform values before submission
  const transformOnSubmit = (values) => ({
    title: values.title?.trim(),
    description: values.description?.trim() || undefined,
    imageId: values.imageId || undefined,
    videoId: values.videoId || undefined,
  });

  return (
    <Form
      loadData={loadData}
      dependencies={[isEdit, section, courseIdFromUrl, hasPresetCourse]}
      validation={validation}
      transformOnSubmit={transformOnSubmit}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Section" : "Create Section"}
      autosave={true}
      autosaveKey="section"
      autosaveMode={mode}
      autosaveEntityId={section?.sections?.sectionId}
    >
      {(form, data) => {
        const courseOptions =
          data?.courses?.map((c) => {
            const courseData = c.courses || c;
            return {
              value: courseData.courseId,
              label: courseData.courseName,
            };
          }) || [];

        return (
          <>
            {/* Show course context when adding from within a course OR editing */}
            {(hasPresetCourse || isEdit) && data?.courseName && (
              <div className="bg-bg2 rounded-lg px-4 py-3 border border-border-primary">
                <p className="text-sm text-text/70">
                  {isEdit ? "Section belongs to:" : "Adding section to:"}
                </p>
                <p className="text-base font-medium text-heading">
                  {data.courseName}
                </p>
              </div>
            )}

            {/* Only show course selector when NOT coming from a course context and NOT editing */}
            {!isEdit && !hasPresetCourse && (
              <FormField
                label="Course"
                name="courseId"
                required
                error={form.touched.courseId && form.errors.courseId}
              >
                <FormSelect
                  {...form.getFieldProps("courseId")}
                  options={courseOptions}
                  placeholder="Select a course"
                />
              </FormField>
            )}

            <FormField
              label="Section Title"
              name="title"
              required
              error={form.touched.title && form.errors.title}
            >
              <FormInput
                {...form.getFieldProps("title")}
                placeholder="e.g. Getting Started"
              />
            </FormField>

            <FormField
              label="Description"
              name="description"
              error={form.touched.description && form.errors.description}
              help="What will students learn in this section?"
            >
              <FormTextarea
                {...form.getFieldProps("description")}
                placeholder="Describe the section content..."
              />
            </FormField>

            <MediaInput
              label="Section Image"
              value={form.values.imageId}
              onChange={(imageId) => form.setFieldValue("imageId", imageId)}
              mediaType="image"
              placeholder="Select or upload section image"
              showPreview={true}
            />

            <MediaInput
              label="Section Video (optional)"
              value={form.values.videoId}
              onChange={(videoId) => form.setFieldValue("videoId", videoId)}
              mediaType="video"
              placeholder="Select or upload section video"
              showPreview={true}
            />
          </>
        );
      }}
    </Form>
  );
}
