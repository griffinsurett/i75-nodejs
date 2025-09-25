// frontend/src/components/instructor/components/InstructorStats.jsx
import { BookOpen } from "lucide-react";
import DateDisplay from "../../common/DateDisplay";
import StatsGrid from "../../common/StatsGrid";

export default function InstructorStats({
  instructor,
  showExtended = false,
  className = "",
}) {
  const instructorData = instructor.instructors || instructor;

  if (!showExtended) {
    // Simple view - keep as is
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
      </div>
    );
  }

  // Extended view - use StatsGrid
  const stats = [
    { label: "Courses", value: instructorData.courseCount || 0 },
    { label: "Students", value: instructorData.studentCount || 0 },
    { label: "Rating", value: instructorData.rating ? `${instructorData.rating}/5.0` : "N/A" },
    { label: "Experience", value: instructorData.experience || "N/A" }
  ];

  return <StatsGrid stats={stats} className={className} />;
}