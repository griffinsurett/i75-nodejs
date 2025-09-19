// frontend/src/components/course/CourseForm.jsx
// Replace the image and video upload sections with MediaInput

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseAPI, instructorAPI } from "../../services/api";
import { Loader2 } from "lucide-react";
import MediaInput from "../media/MediaInput";

export default function CourseForm({ mode = "create", course }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    courseName: "",
    description: "",
    imageId: null,
    videoId: null,
    instructorIds: [],
  });

  // Track media metadata for display
  const [imageMetadata, setImageMetadata] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  const canSubmit = useMemo(
    () => form.courseName.trim().length > 0 && !submitting,
    [form.courseName, submitting]
  );

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);

        if (isEdit && course) {
          const courseData = course.courses || course;

          setForm({
            courseName: courseData.courseName || "",
            description: courseData.description || "",
            imageId: courseData.imageId || null,
            videoId: courseData.videoId || null,
            instructorIds:
              courseData.instructors?.map((i) => (i.instructors || i).instructorId) || [],
          });
        }

        const r = await instructorAPI.getAllInstructors();
        setInstructors(r.data?.data || []);
      } catch {
        setInstructors([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleInstructor = (id) => {
    setForm((f) => {
      const exists = f.instructorIds.includes(id);
      return {
        ...f,
        instructorIds: exists
          ? f.instructorIds.filter((x) => x !== id)
          : [...f.instructorIds, id],
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
        courseName: form.courseName.trim(),
        description: form.description || undefined,
        imageId: form.imageId || undefined,
        videoId: form.videoId || undefined,
        instructorIds: form.instructorIds?.length ? form.instructorIds : undefined,
      };

      if (!isEdit) {
        const res = await courseAPI.createCourse(payload);
        const created = res.data?.data;
        const id = created?.courseId;
        if (id) navigate(`/courses/${id}`);
      } else {
        const courseData = course.courses || course;
        const id = courseData.courseId;
        await courseAPI.updateCourse(id, payload);
        navigate(`/courses/${id}`);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          (isEdit ? "Failed to update course" : "Failed to create course")
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
        <label className="block text-sm text-text mb-1">Course name *</label>
        <input
          name="courseName"
          value={form.courseName}
          onChange={handleChange}
          className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g. Introduction to Programming"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-text mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="What is this course about?"
        />
      </div>

      {/* Course Image - Using MediaInput */}
      <MediaInput
        label="Course Image"
        value={form.imageId}
        onChange={(imageId) => setForm(f => ({ ...f, imageId }))}
        onMetaChange={setImageMetadata}
        mediaType="image"
        placeholder="Select or upload course image"
        showPreview={true}
      />

      {/* Course Video - Using MediaInput */}
      <MediaInput
        label="Course Video (optional)"
        value={form.videoId}
        onChange={(videoId) => setForm(f => ({ ...f, videoId }))}
        onMetaChange={setVideoMetadata}
        mediaType="video"
        placeholder="Select or upload course video"
        showPreview={true}
      />

      {/* Instructors Section */}
      <div>
        <label className="block text-sm text-text mb-2">
          Assign Instructors (optional)
        </label>
        <div className="max-h-40 overflow-auto rounded-lg border border-border-primary p-2 bg-bg2">
          {instructors.length === 0 ? (
            <p className="text-xs text-text/70 px-1">No instructors yet</p>
          ) : (
            <ul className="space-y-1">
              {instructors.map((i) => {
                const instructorData = i.instructors || i;
                return (
                  <li key={instructorData.instructorId} className="flex items-center gap-2">
                    <input
                      id={`inst-${instructorData.instructorId}`}
                      type="checkbox"
                      className="accent-primary"
                      checked={form.instructorIds.includes(instructorData.instructorId)}
                      onChange={() => toggleInstructor(instructorData.instructorId)}
                    />
                    <label
                      htmlFor={`inst-${instructorData.instructorId}`}
                      className="text-sm text-text"
                    >
                      {instructorData.name}
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
            ? isEdit ? "Updating…" : "Creating…"
            : isEdit ? "Update Course" : "Create Course"}
        </button>
      </div>
    </form>
  );
}