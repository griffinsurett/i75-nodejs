// frontend/src/components/course/sections/detail/SectionHeader.jsx
import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import EntityHeader from "../../../common/EntityHeader";

export default function SectionHeader({ section }) {
  const sectionData = section.sections || section;
  const courseData = section.courses || {};
  const imageData = section.images;
  const videoData = section.videos;

  const breadcrumb = (
    <>
      <Layers className="w-4 h-4" />
      <Link
        to={`/courses/${sectionData.courseId}`}
        className="hover:underline"
      >
        {courseData.courseName}
      </Link>
    </>
  );

  const dates = [
    { label: "Created", date: sectionData.createdAt },
    sectionData.updatedAt && { label: "Last Updated", date: sectionData.updatedAt }
  ].filter(Boolean);

  return (
    <EntityHeader
      title={sectionData.title}
      description={sectionData.description}
      image={imageData}
      video={videoData}
      breadcrumb={breadcrumb}
      dates={dates}
      isArchived={sectionData.isArchived}
      archivedAt={sectionData.archivedAt}
      scheduledDeleteAt={sectionData.purgeAfterAt}
      imageType="section"
      gradientColors="from-green-500 to-teal-600"
    />
  );
}