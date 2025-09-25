// frontend/src/components/instructor/InstructorProfileHeader.jsx
import EntityHeader from "../../common/EntityHeader";

export default function InstructorProfileHeader({
  instructor,
  imageData,
  gradient = "from-purple-500 to-pink-600",
  className = "",
}) {
  const instructorData = instructor.instructors || instructor;

  const dates = [
    { label: "Joined", date: instructorData.createdAt },
    instructorData.updatedAt && { label: "Last Updated", date: instructorData.updatedAt }
  ].filter(Boolean);

  const additionalInfo = instructorData.courses?.length > 0 && (
    <div className="mt-4">
      <div className="text-sm text-text/70">
        Teaching {instructorData.courses.length} course{instructorData.courses.length !== 1 ? 's' : ''}
      </div>
    </div>
  );

  return (
    <EntityHeader
      title={instructorData.name}
      description={instructorData.bio}
      image={imageData}
      dates={dates}
      isArchived={instructorData.isArchived}
      archivedAt={instructorData.archivedAt}
      scheduledDeleteAt={instructorData.purgeAfterAt}
      additionalInfo={additionalInfo}
      imageType="user"
      gradientColors={gradient}
    />
  );
}