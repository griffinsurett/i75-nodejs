// frontend/src/components/instructor/components/InstructorCoursesList.jsx
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function InstructorCoursesList({ 
  courses = [], 
  showViewAll = false,
  maxDisplay = 5,
  className = '' 
}) {
  const displayCourses = showViewAll ? courses : courses.slice(0, maxDisplay);
  const hasMore = courses.length > maxDisplay && !showViewAll;

  if (courses.length === 0) {
    return (
      <div className={`text-text/70 ${className}`}>
        No courses assigned
      </div>
    );
  }

  return (
    <div className={className}>
      <ul className="space-y-2">
        {displayCourses.map((course) => {
          const courseData = course.courses || course;
          return (
            <li key={courseData.courseId}>
              <Link
                to={`/courses/${courseData.courseId}`}
                className="group flex items-center justify-between p-2 rounded-lg hover:bg-bg2 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-primary group-hover:text-primary/80 truncate">
                    {courseData.courseName}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-text/40 group-hover:text-text/60 flex-shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
      
      {hasMore && (
        <div className="mt-3 text-sm text-text/60 text-center">
          and {courses.length - maxDisplay} more...
        </div>
      )}
    </div>
  );
}