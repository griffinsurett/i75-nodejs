// frontend/src/components/course/components/CourseHeader.jsx
import EntityHeader from "../../common/EntityHeader";
import CourseInstructors from "./CourseInstructors";

export default function CourseHeader({ course }) {
  const courseData = course.courses || course;
  const imageData = course.images;
  const videoData = course.videos;

  const dates = [
    { label: "Created", date: courseData.createdAt },
    courseData.updatedAt && { label: "Last Updated", date: courseData.updatedAt }
  ].filter(Boolean);

  const additionalInfo = courseData.instructors?.length > 0 && (
    <CourseInstructors instructors={courseData.instructors} />
  );

  return (
    <EntityHeader
      title={courseData.courseName}
      description={courseData.description}
      image={imageData}
      video={videoData}
      dates={dates}
      isArchived={courseData.isArchived}
      archivedAt={courseData.archivedAt}
      scheduledDeleteAt={courseData.purgeAfterAt}
      additionalInfo={additionalInfo}
      imageType="course"
      gradientColors="from-blue-500 to-purple-600"
    />
  );
}