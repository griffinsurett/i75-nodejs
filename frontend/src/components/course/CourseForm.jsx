// frontend/src/components/course/CourseForm.jsx
import { courseAPI, instructorAPI } from '../../services/api';
import { validators } from '../../utils/forms/validation';
import {
  Form,
  FormField,
  FormInput,
  FormTextarea,
  FormCheckboxList,
} from '../forms';
import MediaInput from '../media/MediaInput';

export default function CourseForm({ mode = 'create', course }) {
  const isEdit = mode === 'edit';

  // Define validation
  const validation = {
    courseName: validators.compose(
      validators.required('Course name is required'),
      validators.minLength(3, 'Course name must be at least 3 characters')
    ),
    description: validators.maxLength(
      1000,
      'Description must be less than 1000 characters'
    ),
  };

  // Load initial data
  const loadData = async () => {
    const res = await instructorAPI.getAllInstructors();
    const instructors = res.data?.data || [];
    
    let formData = {
      courseName: '',
      description: '',
      imageId: null,
      videoId: null,
      instructorIds: [],
    };

    if (isEdit && course) {
      const courseData = course.courses || course;
      formData = {
        courseName: courseData.courseName || '',
        description: courseData.description || '',
        imageId: courseData.imageId || null,
        videoId: courseData.videoId || null,
        instructorIds: courseData.instructors?.map(
          (i) => (i.instructors || i).instructorId
        ) || [],
      };
    }

    return { formData, instructors };
  };

  // Handle submission
  const handleSubmit = async (values) => {
    if (!isEdit) {
      const res = await courseAPI.createCourse(values);
      const id = res.data?.data?.courseId;
      return { navigateTo: `/courses/${id}` };
    } else {
      const courseData = course.courses || course;
      const id = courseData.courseId;
      await courseAPI.updateCourse(id, values);
      return { navigateTo: `/courses/${id}` };
    }
  };

  // Transform values before submission
  const transformOnSubmit = (values) => ({
    courseName: values.courseName?.trim(),
    description: values.description?.trim() || undefined,
    imageId: values.imageId || undefined,
    videoId: values.videoId || undefined,
    instructorIds: values.instructorIds?.length 
      ? values.instructorIds 
      : undefined,
  });

  return (
    <Form
      loadData={loadData}
      dependencies={[isEdit, course]}
      validation={validation}
      transformOnSubmit={transformOnSubmit}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Update Course' : 'Create Course'}
      
      // AUTOSAVE CONFIGURATION (just add these props!)
      autosave={true}
      autosaveKey="course"
      autosaveMode={mode}
      autosaveEntityId={course?.courses?.courseId || course?.courseId}
      autosaveExcludeFields={['imageMetadata', 'videoMetadata']}
    >
      {(form, data) => {
        const instructorOptions = data?.instructors?.map((i) => {
          const instructorData = i.instructors || i;
          return {
            value: instructorData.instructorId,
            label: instructorData.name,
          };
        }) || [];

        return (
          <>
            {/* Rest of your form fields remain exactly the same */}
            <FormField
              label="Course name"
              name="courseName"
              required
              error={form.touched.courseName && form.errors.courseName}
            >
              <FormInput
                {...form.getFieldProps('courseName')}
                placeholder="e.g. Introduction to Programming"
              />
            </FormField>

            <FormField
              label="Description"
              name="description"
              error={form.touched.description && form.errors.description}
              help="Describe what students will learn in this course"
            >
              <FormTextarea
                {...form.getFieldProps('description')}
                placeholder="What is this course about?"
              />
            </FormField>

            <MediaInput
              label="Course Image"
              value={form.values.imageId}
              onChange={(imageId) => form.setFieldValue('imageId', imageId)}
              mediaType="image"
              placeholder="Select or upload course image"
              showPreview={true}
            />

            <MediaInput
              label="Course Video (optional)"
              value={form.values.videoId}
              onChange={(videoId) => form.setFieldValue('videoId', videoId)}
              mediaType="video"
              placeholder="Select or upload course video"
              showPreview={true}
            />

            <FormCheckboxList
              label="Assign Instructors (optional)"
              name="instructorIds"
              options={instructorOptions}
              value={form.values.instructorIds}
              onChange={(value) => form.setFieldValue('instructorIds', value)}
              emptyText="No instructors available"
            />
          </>
        );
      }}
    </Form>
  );
}