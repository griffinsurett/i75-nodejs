// frontend/src/components/instructor/InstructorForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instructorAPI, courseAPI } from "../../services/api";
import { Loader2 } from "lucide-react";
import MediaInput from "../media/MediaInput";

export default function InstructorForm({ mode = "create", instructor }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    name: "",
    bio: "",
    imageId: null,
    courseIds: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const canSubmit = useMemo(
    () => form.name.trim().length > 0 && !submitting,
    [form.name, submitting]
  );

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);

        if (isEdit && instructor) {
          const instructorData = instructor.instructors || instructor;

          setForm({
            name: instructorData.name || "",
            bio: instructorData.bio || "",
            imageId: instructorData.imageId || null,
            courseIds:
              instructorData.courses?.map((c) => (c.courses || c).courseId) || [],
          });
        }

        const r = await courseAPI.getAllCourses();
        setCourses(r.data?.data || []);
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, instructor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleCourse = (id) => {
    setForm((f) => {
      const exists = f.courseIds.includes(id);
      return {
        ...f,
        courseIds: exists
          ? f.courseIds.filter((x) => x !== id)
          : [...f.courseIds, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        bio: form.bio || undefined,
        imageId: form.imageId || undefined,
        courseIds: form.courseIds?.length ? form.courseIds : undefined,
      };

      if (!isEdit) {
        const res = await instructorAPI.createInstructor(payload);
        const created = res.data?.data;
        const id = created?.instructorId;
        if (id) navigate(`/instructors/${id}`);
      } else {
        const instructorData = instructor.instructors || instructor;
        const id = instructorData.instructorId;
        await instructorAPI.updateInstructor(id, payload);
        navigate(`/instructors/${id}`);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          (isEdit ? "Failed to update instructor" : "Failed to create instructor")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text/70">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="mb-3 text-sm text-red-600 border border-red-300 bg-red-50 rounded p-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-text mb-1">Name *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g. John Doe"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-text mb-1">Bio</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Tell us about this instructor..."
        />
      </div>

      {/* Profile Image - Using MediaInput */}
      <MediaInput
        label="Profile Image"
        value={form.imageId}
        onChange={(imageId) => setForm(f => ({ ...f, imageId }))}
        mediaType="image"
        placeholder="Select or upload profile image"
        showPreview={true}
      />

      {/* Courses Section */}
      <div>
        <label className="block text-sm text-text mb-2">
          Assign to Courses (optional)
        </label>
        <div className="max-h-40 overflow-auto rounded-lg border border-border-primary p-2 bg-bg2">
          {courses.length === 0 ? (
            <p className="text-xs text-text/70 px-1">No courses available</p>
          ) : (
            <ul className="space-y-1">
              {courses.map((c) => {
                const courseData = c.courses || c;
                return (
                  <li
                    key={courseData.courseId}
                    className="flex items-center gap-2"
                  >
                    <input
                      id={`course-${courseData.courseId}`}
                      type="checkbox"
                      className="accent-primary"
                      checked={form.courseIds.includes(courseData.courseId)}
                      onChange={() => toggleCourse(courseData.courseId)}
                    />
                    <label
                      htmlFor={`course-${courseData.courseId}`}
                      className="text-sm text-text"
                    >
                      {courseData.courseName}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3 py-2 text-sm rounded-lg border border-border-primary text-text hover:bg-bg2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-3 py-2 text-sm rounded-lg text-white bg-primary hover:opacity-90 disabled:opacity-50"
        >
          {submitting
            ? isEdit
              ? "Updating…"
              : "Creating…"
            : isEdit
            ? "Update Instructor"
            : "Create Instructor"}
        </button>
      </div>
    </form>
  );
}