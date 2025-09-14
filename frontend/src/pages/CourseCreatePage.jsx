import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import CourseForm from "../components/CourseForm";

export default function CourseCreatePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/courses" className="inline-flex items-center text-primary hover:text-primary/65">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>
      </div>

      <div className="bg-bg rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold text-heading">Add Course</h1>
        </div>
        <CourseForm mode="create" />
      </div>
    </div>
  );
}
