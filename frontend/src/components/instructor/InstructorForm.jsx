import { instructorAPI, courseAPI } from "../../services/api";
import { validators } from "../../utils/forms/validation";
import {
  Form,
  FormField,
  FormInput,
  FormTextarea,
  FormCheckboxList,
} from "../forms";
import MediaInput from "../media/MediaInput";

export default function InstructorForm({ mode = "create", instructor }) {
  const isEdit = mode === "edit";

  // Define validation
  const validation = {
    name: validators.compose(
      validators.required("Name is required"),
      validators.minLength(2, "Name must be at least 2 characters")
    ),
    bio: validators.maxLength(500, "Bio must be less than 500 characters"),
  };

  // Load initial data
  const loadData = async () => {
    const res = await courseAPI.getAllCourses();
    const courses = res.data?.data || [];

    let formData = {
      name: "",
      bio: "",
      imageId: null,
      courseIds: [],
    };

    if (isEdit && instructor) {
      const data = instructor.instructors || instructor;
      formData = {
        name: data.name || "",
        bio: data.bio || "",
        imageId: data.imageId || null,
        courseIds: data.courses?.map((c) => (c.courses || c).courseId) || [],
      };
    }

    return { formData, courses };
  };

  // Handle submission
  const handleSubmit = async (values) => {
    if (!isEdit) {
      const res = await instructorAPI.createInstructor(values);
      const id = res.data?.data?.instructorId;
      return { navigateTo: `/instructors/${id}` };
    } else {
      const id =
        instructor.instructors?.instructorId || instructor.instructorId;
      await instructorAPI.updateInstructor(id, values);
      return { navigateTo: `/instructors/${id}` };
    }
  };

  // Transform values before submission
  const transformOnSubmit = (values) => ({
    name: values.name?.trim(),
    bio: values.bio?.trim() || undefined,
    imageId: values.imageId || undefined,
    courseIds: values.courseIds?.length ? values.courseIds : undefined,
  });

  return (
    <Form
      loadData={loadData}
      dependencies={[isEdit, instructor]}
      validation={validation}
      transformOnSubmit={transformOnSubmit}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Instructor" : "Create Instructor"}
      autosave={true}
      autosaveKey="instructor"
      autosaveMode={mode}
      autosaveEntityId={instructor?.instructors?.instructorId}
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
            <FormField
              label="Name"
              name="name"
              required
              error={form.touched.name && form.errors.name}
            >
              <FormInput
                {...form.getFieldProps("name")}
                placeholder="e.g. John Doe"
              />
            </FormField>

            <FormField
              label="Bio"
              name="bio"
              error={form.touched.bio && form.errors.bio}
            >
              <FormTextarea
                {...form.getFieldProps("bio")}
                placeholder="Tell us about this instructor..."
              />
            </FormField>

            <MediaInput
              label="Profile Image"
              value={form.values.imageId}
              onChange={(imageId) => form.setFieldValue("imageId", imageId)}
              mediaType="image"
              placeholder="Select or upload profile image"
              showPreview={true}
            />

            <FormCheckboxList
              label="Assign to Courses (optional)"
              name="courseIds"
              options={courseOptions}
              value={form.values.courseIds}
              onChange={(value) => form.setFieldValue("courseIds", value)}
              emptyText="No courses available"
            />
          </>
        );
      }}
    </Form>
  );
}
