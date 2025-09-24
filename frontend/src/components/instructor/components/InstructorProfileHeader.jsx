// frontend/src/components/instructor/InstructorProfileHeader.jsx
import InstructorAvatar from "./InstructorAvatar";
import ArchiveBadge from "../../archive/ArchiveBadge";

export default function InstructorProfileHeader({
  instructor,
  imageData,
  gradient = "from-purple-500 to-pink-600",
  className = "",
}) {
  const instructorData = instructor.instructors || instructor;

  return (
    <div className={`bg-bg rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className={`h-32 bg-gradient-to-r ${gradient}`}></div>
      <div className="px-6 pb-6 -mt-16">
        <div className="flex items-end gap-6">
          <div className="bg-bg rounded-full">
            <InstructorAvatar
              imageUrl={imageData?.imageUrl}
              altText={imageData?.altText}
              name={instructorData.name}
              size="medium"
              showBorder={true}
            />
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-heading">
                {instructorData.name}
              </h1>
              {instructorData.isArchived && (
                <ArchiveBadge
                  archivedAt={instructorData.archivedAt}
                  scheduledDeleteAt={instructorData.purgeAfterAt}
                />
              )}
            </div>
            <p className="text-text/70 text-lg">
              {instructorData.bio || "No bio available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
