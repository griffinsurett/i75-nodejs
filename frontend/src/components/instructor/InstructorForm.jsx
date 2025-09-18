// frontend/src/components/instructor/InstructorForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instructorAPI, courseAPI, uploadAPI, imageAPI } from "../../services/api";
import { Loader2, X, Image } from "lucide-react";

export default function InstructorForm({ mode = "create", instructor }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    name: "",
    bio: "",
    altText: "",
    courseIds: [],
  });

  // Image handling
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track original image for updates
  const [original, setOriginal] = useState({
    imageId: null,
    altText: "",
  });

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
          // Extract nested data
          const instructorData = instructor.instructors || instructor;
          const imageData = instructor.images;

          setForm({
            name: instructorData.name || "",
            bio: instructorData.bio || "",
            altText: imageData?.altText || "",
            courseIds:
              instructorData.courses?.map((c) => (c.courses || c).courseId) || [],
          });

          setImagePreview(imageData?.imageUrl || "");
          setOriginal({
            imageId: instructorData.imageId,
            altText: imageData?.altText || "",
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

  const handleImageChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setImageFile(null);
      setImagePreview("");
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setError("");
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
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
      let uploadedImageId;

      // Upload new image file (if chosen)
      if (imageFile) {
        const up = await uploadAPI.uploadImage(imageFile, form.altText);
        uploadedImageId = up.data?.data?.imageId;
      }

      if (!isEdit) {
        // CREATE instructor
        const payload = {
          name: form.name.trim(),
          bio: form.bio || undefined,
          imageId: uploadedImageId !== undefined ? uploadedImageId : undefined,
          courseIds: form.courseIds?.length ? form.courseIds : undefined,
        };

        const res = await instructorAPI.createInstructor(payload);
        const created = res.data?.data;
        const id = created?.instructorId;
        if (id) navigate(`/instructors/${id}`);
      } else {
        // UPDATE instructor
        const instructorData = instructor.instructors || instructor;
        const id = instructorData.instructorId;
        const payload = {
          name: form.name.trim() || undefined,
          bio: form.bio || undefined,
          imageId: imageFile ? uploadedImageId : undefined,
          altText: form.altText || undefined,
          courseIds: form.courseIds?.length ? form.courseIds : [],
        };

        await instructorAPI.updateInstructor(id, payload);

        // Update existing image alt text if needed
        const trimmedNew = (form.altText ?? "").trim();
        const trimmedOld = (original.altText ?? "").trim();
        const mustUpdateExistingImageAlt =
          !imageFile && original.imageId && trimmedNew !== trimmedOld;

        if (mustUpdateExistingImageAlt) {
          try {
            await imageAPI.updateImage(original.imageId, {
              altText: trimmedNew,
            });
          } catch (err) {
            console.error("Failed to update image alt text:", err);
          }
        }

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

      {/* Image Upload Section */}
      <div className="border border-border-primary rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-heading flex items-center gap-2">
          <Image className="w-4 h-4" />
          Profile Image
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-text mb-1">
              {isEdit ? "Upload New Image (optional)" : "Upload Image"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt={form.altText || "Profile image preview"}
                  className="w-32 h-32 object-cover rounded-full border border-border-primary"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-text mb-1">
              Image Alt Text
            </label>
            <input
              name="altText"
              value={form.altText}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe the image"
            />
          </div>
        </div>
      </div>

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