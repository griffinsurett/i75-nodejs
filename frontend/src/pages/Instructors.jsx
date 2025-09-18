// frontend/src/pages/Instructors.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Book,
  User,
  Loader2,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import { instructorAPI } from "../services/api";
import ActiveArchivedTabs from "../components/archive/ActiveArchivedTabs";
import ArchivedNotice from "../components/archive/ArchivedNotice";
import EditActions from "../components/archive/EditActions";
import ArchiveBadge from "../components/archive/ArchiveBadge";
import useArchiveViewParam from "../hooks/useArchiveViewParam";

/**
 * Normalize server payloads so the UI can use camelCase consistently.
 * (Works even if backend already returns camelCase.)
 */
const normalizeInstructor = (i) => ({
  ...i,
  instructorId: i.instructorId ?? i.instructor_id,
  name: i.name,
  bio: i.bio,
  instructorImage: i.instructorImage ?? i.instructor_image,
  imageAltText: i.imageAltText ?? i.image_alt_text,
  isArchived: i.isArchived ?? i.is_archived,
  archivedAt: i.archivedAt ?? i.archived_at,
  purgeAfterAt: i.purgeAfterAt ?? i.purge_after_at,
});

const normalizeCourse = (c) => ({
  ...c,
  courseId: c.courseId ?? c.course_id,
  courseName: c.courseName ?? c.course_name,
  isArchived: c.isArchived ?? c.is_archived,
});

const Instructors = () => {
  const [view, setView] = useArchiveViewParam(); // "active" | "archived"
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    image_url: "", // keep snake_case keys for API compatibility on submit
    alt_text: "",
  });
  const [showCourses, setShowCourses] = useState({});
  const [instructorCourses, setInstructorCourses] = useState({});

  const isArchivedView = view === "archived";

  // Fetch all instructors
  const fetchInstructors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = isArchivedView ? { archived: "true" } : {};
      const res = await instructorAPI.getAllInstructors(params);
      const list = res?.data?.data ?? [];
      setInstructors(list.map(normalizeInstructor));
    } catch (e) {
      console.error(e);
      setError("Failed to fetch instructors");
    } finally {
      setLoading(false);
    }
  }, [isArchivedView]);

  // Fetch courses for an instructor (lazy)
  const fetchInstructorCourses = async (instructorId) => {
    try {
      const res = await instructorAPI.getInstructorCourses(instructorId);
      const list = (res?.data?.data ?? []).map(normalizeCourse);
      setInstructorCourses((prev) => ({ ...prev, [instructorId]: list }));
    } catch (e) {
      console.error("Failed to fetch instructor courses:", e);
    }
  };

  // Toggle the courses panel for a card
  const toggleCourses = async (instructorId) => {
    setShowCourses((prev) => {
      const next = { ...prev, [instructorId]: !prev[instructorId] };
      return next;
    });
    if (!instructorCourses[instructorId]) {
      await fetchInstructorCourses(instructorId);
    }
  };

  // Init
  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  // Start edit flow
  const handleEdit = (instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      name: instructor.name || "",
      bio: instructor.bio || "",
      image_url: instructor.instructorImage || "",
      alt_text: instructor.imageAltText || "",
    });
    setShowForm(true);
  };

  // Cancel form
  const cancelForm = () => {
    setShowForm(false);
    setEditingInstructor(null);
    setFormData({ name: "", bio: "", image_url: "", alt_text: "" });
  };

  // Submit add/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInstructor) {
        await instructorAPI.updateInstructor(
          editingInstructor.instructorId,
          formData
        );
      } else {
        await instructorAPI.createInstructor(formData);
      }
      cancelForm();
      fetchInstructors();
    } catch (e) {
      console.error(e);
      setError(editingInstructor ? "Failed to update instructor" : "Failed to create instructor");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text/70">Loading instructors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-heading flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              {isArchivedView ? "Archived Instructors" : "Instructors"}
            </h1>
            <ActiveArchivedTabs value={view} onChange={setView} className="ml-2" />
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Instructor
            </button>
          )}
        </div>
        <p className="mt-2 text-text/70">Manage your course instructors</p>
      </div>

      {isArchivedView && <ArchivedNotice />}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-8 bg-bg rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-heading">
              {editingInstructor ? "Edit Instructor" : "Add New Instructor"}
            </h2>
            <button onClick={cancelForm} className="text-text/50 hover:text-text/70">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-bg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-bg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Bio</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-bg"
                placeholder="Brief biography of the instructor..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Image Alt Text
              </label>
              <input
                type="text"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                placeholder="Description of the image for accessibility"
                className="w-full px-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-bg"
              />
            </div>

            {formData.image_url && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-text mb-2">
                  Image Preview
                </label>
                <img
                  src={formData.image_url}
                  alt={formData.alt_text || "Instructor image preview"}
                  className="w-32 h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                <Save className="h-4 w-4" />
                {editingInstructor ? "Update" : "Create"} Instructor
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-bg2 text-text rounded-lg hover:bg-bg3 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map((instructor) => (
          <div
            key={instructor.instructorId}
            className="bg-bg rounded-lg shadow-md overflow-hidden relative"
          >
            {/* Card actions */}
            <div className="absolute top-2 right-2 z-10">
              <EditActions
                id={instructor.instructorId}
                isArchived={instructor.isArchived}
                editTo={`/instructors/${instructor.instructorId}/edit`}
                entityName="instructor"
                api={{
                  archive: instructorAPI.archiveInstructor,
                  restore: instructorAPI.restoreInstructor,
                  delete: instructorAPI.deleteInstructor,
                }}
                onChanged={fetchInstructors}
                buttonClassName="w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/70"
              />
            </div>

            {/* Image */}
            <div className="h-48 bg-bg2 flex items-center justify-center relative">
              {instructor.instructorImage ? (
                <img
                  src={instructor.instructorImage}
                  alt={instructor.imageAltText || instructor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-20 w-20 text-text/30" />
              )}

              {/* Archive badge with countdown (now gets camelCase dates) */}
              {instructor.isArchived && (
                <span className="absolute bottom-2 left-2">
                  <ArchiveBadge
                    archivedAt={instructor.archivedAt}
                    scheduledDeleteAt={instructor.purgeAfterAt}
                  />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-heading mb-2">
                {instructor.name}
              </h3>

              {instructor.bio && (
                <p className="text-sm text-text/70 mb-4 line-clamp-3">
                  {instructor.bio}
                </p>
              )}

              {/* View Courses */}
              <button
                onClick={() => toggleCourses(instructor.instructorId)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-bg2 text-text rounded hover:bg-bg3 transition-colors text-sm"
              >
                <Book className="h-4 w-4" />
                {showCourses[instructor.instructorId] ? "Hide" : "View"} Courses
              </button>

              {/* Courses list */}
              {showCourses[instructor.instructorId] && (
                <div className="mt-4 pt-4 border-t border-border-primary">
                  <h4 className="text-sm font-semibold text-heading mb-2">
                    Teaching Courses:
                  </h4>
                  {instructorCourses[instructor.instructorId]?.length > 0 ? (
                    <ul className="space-y-1">
                      {instructorCourses[instructor.instructorId].map((course) => (
                        <li key={course.courseId} className="text-sm text-text/70">
                          • {course.courseName}
                          {course.isArchived && (
                            <span className="ml-1 text-xs text-text/50">
                              (Archived)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-text/50 italic">
                      No courses assigned
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {instructors.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-text/30 mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">
            {isArchivedView ? "No archived instructors" : "No instructors yet"}
          </h3>
          <p className="text-text/70 mb-4">
            {isArchivedView
              ? "Archived instructors will appear here"
              : "Get started by adding your first instructor"}
          </p>
          {!isArchivedView && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add First Instructor
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Instructors;
