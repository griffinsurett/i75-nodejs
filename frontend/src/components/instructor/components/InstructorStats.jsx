// frontend/src/components/instructor/components/InstructorStats.jsx
import { BookOpen, Calendar, Users, Award } from "lucide-react";
import { formatDate } from "../../../utils/formatDate";

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

      <div className="flex items-center text-text">
        <Calendar className="w-4 h-4 mr-2" />
        <span>
          Joined: {formatDate(instructorData.createdAt, { variant: "short" })}
        </span>
      </div>

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
