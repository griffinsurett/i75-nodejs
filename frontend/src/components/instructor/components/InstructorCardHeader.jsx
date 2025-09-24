// frontend/src/components/instructor/InstructorCardHeader.jsx
import InstructorAvatar from "./InstructorAvatar";
import EditActions from "../../archive/EditActions";
import ArchiveBadge from "../../archive/ArchiveBadge";
import { instructorAPI } from "../../../services/api";

export default function InstructorCardHeader({
  instructor,
  imageData,
  onChanged,
  gradient = "from-purple-500 to-pink-600",
}) {
  const instructorData = instructor.instructors || instructor;

  return (
    <div className="relative">
      {/* Actions */}
      <div className="absolute top-2 right-2 z-10">
        <EditActions
          id={instructorData.instructorId}
          isArchived={instructorData.isArchived}
          editTo={`/instructors/${instructorData.instructorId}/edit`}
          entityName="instructor"
          api={{
            archive: instructorAPI.archiveInstructor,
            restore: instructorAPI.restoreInstructor,
            delete: instructorAPI.deleteInstructor,
          }}
          onChanged={onChanged}
        />
      </div>

      {/* Profile Image Section */}
      <div
        className={`h-48 bg-gradient-to-r ${gradient} flex items-center justify-center relative`}
      >
        <InstructorAvatar
          imageUrl={imageData?.imageUrl}
          altText={imageData?.altText}
          name={instructorData.name}
          size="medium"
          showBorder={true}
        />

        {instructorData.isArchived && (
          <span className="absolute bottom-2 left-2">
            <ArchiveBadge
              archivedAt={instructorData.archivedAt}
              scheduledDeleteAt={instructorData.purgeAfterAt}
            />
          </span>
        )}
      </div>
    </div>
  );
}
