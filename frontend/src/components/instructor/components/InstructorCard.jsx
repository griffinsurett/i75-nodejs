// frontend/src/components/instructor/InstructorCard.jsx
import { Link } from "react-router-dom";
import InstructorCardHeader from "./InstructorCardHeader";
import InstructorStats from "./InstructorStats";

export default function InstructorCard({ instructor, onChanged }) {
  const instructorData = instructor.instructors || instructor;
  const imageData = instructor.images;

  return (
    <div className="bg-bg rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <InstructorCardHeader
        instructor={instructor}
        imageData={imageData}
        onChanged={onChanged}
      />

      <div className="p-6">
        <h3 className="text-xl font-semibold text-heading mb-2">
          {instructorData.name}
        </h3>

        <p className="text-text mb-4 line-clamp-3">
          {instructorData.bio || "No bio available"}
        </p>

        <InstructorStats instructor={instructor} className="mb-4" />

        <div className="flex gap-2">
          <Link
            to={`/instructors/${instructorData.instructorId}`}
            className="flex-1 bg-primary hover:bg-primary/65 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors text-center"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
