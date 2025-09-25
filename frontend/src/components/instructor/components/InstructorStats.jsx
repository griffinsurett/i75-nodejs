// frontend/src/components/instructor/components/InstructorStats.jsx
import { BookOpen, Users, Award } from "lucide-react";
import DateDisplay from "../../common/DateDisplay";

export default function InstructorStats({
  instructor,
  showExtended = false,
  className = "",
}) {
  const instructorData = instructor.instructors || instructor;

  return (
    <div className={`space-y-2 text-sm ${className}`}>
      {instructorData.courseCount !== undefined && (
        <div className="flex items-center text-text">
          <BookOpen className="w-4 h-4 mr-2" />
          <span>{instructorData.courseCount} Courses</span>
        </div>
      )}

      <DateDisplay
        label="Joined"
        date={instructorData.createdAt}
        variant="compact"
      />

      {showExtended && (
        <>
          {instructorData.studentCount !== undefined && (
            <div className="flex items-center text-text">
              <Users className="w-4 h-4 mr-2" />
              <span>{instructorData.studentCount} Students</span>
            </div>
          )}

          {instructorData.rating !== undefined && (
            <div className="flex items-center text-text">
              <Award className="w-4 h-4 mr-2" />
              <span>{instructorData.rating}/5.0 Rating</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}