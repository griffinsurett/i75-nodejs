// CourseForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseAPI, instructorAPI, uploadAPI, imageAPI } from "../services/api";
import { Loader2 } from "lucide-react";

export default function CourseForm({ mode = "create", course }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    course_name: "",
    description: "",
    alt_text: "",
    video_id: "",
    instructor_ids: [],
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track original image id/alt so we can decide if we need to update the image record
  const [original, setOriginal] = useState({ image_id: null, alt_text: "" });

  const canSubmit = useMemo(
    () => form.course_name.trim().length > 0 && !submitting,
    [form.course_name, submitting]
  );

  const resolveAlt = (c) =>
    c?.image_alt_text ??
    c?.alt_text ??
    c?.altText ??
    c?.image?.alt_text ??
    c?.image?.altText ??
    c?.imageAltText ??
    "";

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);

        if (isEdit && course) {
          const initialAlt = resolveAlt(course);
          const imageUrl = course?.course_image ?? course?.image?.url ?? "";
          const imageId = course?.image_id ?? course?.image?.image_id ?? null;

          setForm({
            course_name: course.course_name || "",
            description: course.description || "",
            alt_text: initialAlt || "",
            video_id: course.video_id || "",
            instructor_ids:
              course.instructors?.map((i) => i.instructor_id) || [],
          });
          setPreview(imageUrl);
          setOriginal({ image_id: imageId, alt_text: initialAlt || "" });

          // If alt is still unknown but we have an image id, try fetching it
          if (!initialAlt && imageId) {
            try {
              const imgRes = await imageAPI.getImage(imageId);
              const fetchedAlt =
                imgRes?.data?.data?.alt_text ??
                imgRes?.data?.data?.altText ??
                "";
              if (fetchedAlt) {
                setForm((f) => ({ ...f, alt_text: fetchedAlt }));
                setOriginal((o) => ({ ...o, alt_text: fetchedAlt }));
              }
            } catch {
              /* ignore */
            }
          }
        } else {
          setForm({
            course_name: "",
            description: "",
            alt_text: "",
            video_id: "",
            instructor_ids: [],
          });
          setPreview("");
          setOriginal({ image_id: null, alt_text: "" });
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

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setPreview("");
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const toggleInstructor = (id) => {
    setForm((f) => {
      const exists = f.instructor_ids.includes(id);
      return {
        ...f,
        instructor_ids: exists
          ? f.instructor_ids.filter((x) => x !== id)
          : [...f.instructor_ids, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      let uploadedImageId; // new upload (if any)

      // 1) Upload new file (if chosen) – this saves alt text during upload
      if (file) {
        const up = await uploadAPI.uploadImage(file, form.alt_text);
        uploadedImageId = up.data?.data?.image_id;
      }

      if (!isEdit) {
        // 2) CREATE course
        const payload = {
          course_name: form.course_name.trim(),
          description: form.description || undefined,
          video_id: form.video_id || undefined,
          image_id: uploadedImageId !== undefined ? uploadedImageId : undefined,
          instructor_ids:
            form.instructor_ids && form.instructor_ids.length
              ? form.instructor_ids
              : undefined,
        };

        const res = await courseAPI.createCourse(payload);
        const created = res.data?.data;
        const id = created?.courseId ?? created?.course_id;
        if (id) navigate(`/courses/${id}`);
      } else {
        // 2) UPDATE course
        const id = course.course_id ?? course.courseId;
        const payload = {
          course_name: form.course_name.trim() || undefined,
          description: form.description || undefined,
          video_id: form.video_id || undefined,
          image_id: file ? uploadedImageId : undefined, // only when a new file was uploaded
          // alt_text on course payload is ignored by many backends; we still send it,
          // but we also update the image record below when needed.
          alt_text: form.alt_text || undefined,
          instructor_ids:
            form.instructor_ids && form.instructor_ids.length
              ? form.instructor_ids
              : [],
        };

        await courseAPI.updateCourse(id, payload);

        // 3) If NO new file was uploaded and alt text changed, update the existing image record.
        const trimmedNew = (form.alt_text ?? "").trim();
        const trimmedOld = (original.alt_text ?? "").trim();
        const mustUpdateExistingImageAlt =
          !file &&
          original.image_id &&
          trimmedNew !== trimmedOld;

        if (mustUpdateExistingImageAlt) {
          try {
            await imageAPI.updateImage(original.image_id, {
              alt_text: trimmedNew,
              altText: trimmedNew, // be generous with key naming, in case backend expects camelCase
            });
          } catch (err) {
            // Don’t block navigation; surface a soft error if you want.
            console.error("Failed to update image alt text:", err);
          }
        }

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
          name="course_name"
          value={form.course_name}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-text mb-1">
            {isEdit ? "Upload New Image (optional)" : "Upload Image"}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm"
          />
          {preview && (
            <div className="mt-2">
              <img
                src={preview}
                alt={form.alt_text || "Course image preview"}
                className="w-full h-32 object-cover rounded-md border border-border-primary"
              />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm text-text mb-1">Image Alt Text</label>
          <input
            name="alt_text"
            value={form.alt_text}
            onChange={handleChange}
            className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Describe the image"
          />
        </div>
      </div>

      {/* Optional video field kept for parity */}
      {/* <div>
        <label className="block text-sm text-text mb-1">Intro Video ID (optional)</label>
        <input
          name="video_id"
          value={form.video_id}
          onChange={handleChange}
          className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="UUID of an existing video"
        />
      </div> */}

      <div>
        <label className="block text-sm text-text mb-2">Assign Instructors (optional)</label>
        <div className="max-h-40 overflow-auto rounded-lg border border-border-primary p-2 bg-bg2">
          {instructors.length === 0 ? (
            <p className="text-xs text-text/70 px-1">No instructors yet</p>
          ) : (
            <ul className="space-y-1">
              {instructors.map((i) => (
                <li key={i.instructor_id} className="flex items-center gap-2">
                  <input
                    id={`inst-${i.instructor_id}`}
                    type="checkbox"
                    className="accent-primary"
                    checked={form.instructor_ids.includes(i.instructor_id)}
                    onChange={() => toggleInstructor(i.instructor_id)}
                  />
                  <label htmlFor={`inst-${i.instructor_id}`} className="text-sm text-text">
                    {i.name}
                  </label>
                </li>
              ))}
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
          {submitting ? (isEdit ? "Updating…" : "Creating…") : isEdit ? "Update Course" : "Create Course"}
        </button>
      </div>
    </form>
  );
}
