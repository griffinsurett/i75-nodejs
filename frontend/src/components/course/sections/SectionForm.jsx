// frontend/src/components/course/sections/SectionForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sectionAPI, courseAPI, videoAPI } from "../../../services/api";
import { Loader2 } from "lucide-react";
import MediaInput from "../../media/MediaInput";

export default function SectionForm({ mode = "create", section }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = mode === "edit";
  
  // Get courseId from URL params when creating new section
  const urlParams = new URLSearchParams(location.search);
  const courseIdFromUrl = urlParams.get('courseId');

  // Initialize form with courseId from URL if available
  const [form, setForm] = useState({
    courseId: courseIdFromUrl || "",
    title: "",
    description: "",
    imageId: null,
    videoId: null,
  });

  // Track if we're creating from within a course context
  const [courseName, setCourseName] = useState("");
  const hasPresetCourse = !isEdit && Boolean(courseIdFromUrl);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const canSubmit = useMemo(
    () => form.title.trim().length > 0 && (isEdit || form.courseId) && !submitting,
    [form.title, form.courseId, isEdit, submitting]
  );

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);

        if (isEdit && section) {
          const sectionData = section.sections || section;

          setForm({
            courseId: String(sectionData.courseId || ""),
            title: sectionData.title || "",
            description: sectionData.description || "",
            imageId: sectionData.imageId || null,
            videoId: sectionData.videoId || null,
          });
          
          // Get course name for edit mode
          if (section.courses) {
            setCourseName(section.courses.courseName);
          }
        } else if (courseIdFromUrl) {
          // Make sure courseId stays in form for new sections
          setForm(prev => ({
            ...prev,
            courseId: courseIdFromUrl
          }));
        }

        // Fetch course info based on context
        if (hasPresetCourse && courseIdFromUrl) {
          // Fetch the specific course to get its name
          const courseRes = await courseAPI.getCourse(courseIdFromUrl);
          const courseData = courseRes.data?.data?.courses || courseRes.data?.data;
          setCourseName(courseData.courseName);
        } else if (!isEdit) {
          // Only fetch all courses if we need a selector
          const coursesRes = await courseAPI.getAllCourses();
          setCourses(coursesRes.data?.data || []);
        }
      } catch (err) {
        console.error("Error loading form data:", err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, section, courseIdFromUrl, hasPresetCourse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canSubmit) {
      console.error("Cannot submit - validation failed");
      return;
    }

    // For new sections, use either form.courseId or courseIdFromUrl
    const finalCourseId = isEdit ? 
      (section?.sections?.courseId || section?.courseId) : 
      (form.courseId || courseIdFromUrl);

    if (!isEdit && !finalCourseId) {
      setError("Course ID is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (!isEdit) {
        // CREATE section - use the same API call as the modal
        const courseIdNum = parseInt(finalCourseId);
        
        if (isNaN(courseIdNum)) {
          throw new Error("Invalid course ID");
        }

        // Don't include courseId in payload since it's in the URL
        const payload = {
          title: form.title.trim(),
          description: form.description || undefined,
          imageId: form.imageId || undefined,
          videoId: form.videoId || undefined,
        };

        const res = await courseAPI.createCourseSection(courseIdNum, payload);
        const created = res.data?.data;
        const id = created?.sectionId;
        
        // Navigate to the section under its course
        if (id) {
          navigate(`/courses/${finalCourseId}`);
        }
      } else {
        // UPDATE section
        const sectionData = section.sections || section;
        const id = sectionData.sectionId;
        const courseId = sectionData.courseId || form.courseId;
        
        const payload = {
          title: form.title.trim() || undefined,
          description: form.description || undefined,
          imageId: form.imageId || undefined,
          videoId: form.videoId || undefined,
        };

        await sectionAPI.updateSection(id, payload);

        // Navigate back to the section detail under its course
        navigate(`/courses/${courseId}/sections/${id}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          (isEdit ? "Failed to update section" : "Failed to create section")
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

      {/* Show course context when adding from within a course OR editing */}
      {(hasPresetCourse || isEdit) && courseName && (
        <div className="bg-bg2 rounded-lg px-4 py-3 border border-border-primary">
          <p className="text-sm text-text/70">
            {isEdit ? "Section belongs to:" : "Adding section to:"}
          </p>
          <p className="text-base font-medium text-heading">{courseName}</p>
        </div>
      )}

      {/* Only show course selector when NOT coming from a course context and NOT editing */}
      {!isEdit && !hasPresetCourse && (
        <div>
          <label className="block text-sm text-text mb-1">Course *</label>
          <select
            name="courseId"
            value={form.courseId}
            onChange={handleChange}
            className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select a course</option>
            {courses.map((c) => {
              const courseData = c.courses || c;
              return (
                <option key={courseData.courseId} value={courseData.courseId}>
                  {courseData.courseName}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm text-text mb-1">Section Title *</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g. Getting Started"
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
          placeholder="What will students learn in this section?"
        />
      </div>

      {/* Section Image - Using MediaInput */}
      <MediaInput
        label="Section Image"
        value={form.imageId}
        onChange={(imageId) => setForm(f => ({ ...f, imageId }))}
        mediaType="image"
        placeholder="Select or upload section image"
        showPreview={true}
      />

      {/* Section Video - Using MediaInput */}
      <MediaInput
        label="Section Video (optional)"
        value={form.videoId}
        onChange={(videoId) => setForm(f => ({ ...f, videoId }))}
        mediaType="video"
        placeholder="Select or upload section video"
        showPreview={true}
      />

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
            ? "Update Section"
            : "Create Section"}
        </button>
      </div>
    </form>
  );
}