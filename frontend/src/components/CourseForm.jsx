// CourseForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseAPI, instructorAPI, uploadAPI, imageAPI, videoAPI } from "../services/api";
import { Loader2, Upload, X, Film, Image } from "lucide-react";

export default function CourseForm({ mode = "create", course }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    course_name: "",
    description: "",
    alt_text: "",
    video_title: "",
    video_description: "",
    video_id: "",
    instructor_ids: [],
  });
  
  // Image handling
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  
  // Video handling
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [useExistingVideo, setUseExistingVideo] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track original image/video for updates
  const [original, setOriginal] = useState({ 
    image_id: null, 
    alt_text: "",
    video_id: null,
    video_url: "",
    video_title: "",
    video_description: ""
  });

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
          const videoId = course?.video_id ?? null;
          const videoTitle = course?.video_title ?? "";
          const videoDescription = course?.video_description ?? "";

          setForm({
            course_name: course.course_name || "",
            description: course.description || "",
            alt_text: initialAlt || "",
            video_id: videoId || "",
            video_title: videoTitle || "",
            video_description: videoDescription || "",
            instructor_ids: course.instructors?.map((i) => i.instructor_id) || [],
          });
          
          setImagePreview(imageUrl);
          setOriginal({ 
            image_id: imageId, 
            alt_text: initialAlt || "",
            video_id: videoId,
            video_title: videoTitle,
            video_description: videoDescription
          });

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
            video_title: "",
            video_description: "",
            instructor_ids: [],
          });
          setImagePreview("");
          setOriginal({ 
            image_id: null, 
            alt_text: "",
            video_id: null,
            video_title: "",
            video_description: ""
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

  const handleVideoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setVideoFile(null);
      setVideoPreview("");
      return;
    }
    if (!f.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    setError("");
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview("");
    setForm(f => ({ ...f, video_title: "", video_description: "" }));
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
      let uploadedImageId;
      let uploadedVideoId;

      // 1) Upload new image file (if chosen)
      if (imageFile) {
        const up = await uploadAPI.uploadImage(imageFile, form.alt_text);
        uploadedImageId = up.data?.data?.image_id;
      }

      // 2) Upload new video file (if chosen)
      if (videoFile && form.video_title) {
        const videoUp = await uploadAPI.uploadVideo(videoFile, form.video_title, form.video_description);
        uploadedVideoId = videoUp.data?.data?.video_id;
      }

      if (!isEdit) {
        // CREATE course
        const payload = {
          course_name: form.course_name.trim(),
          description: form.description || undefined,
          image_id: uploadedImageId !== undefined ? uploadedImageId : undefined,
          video_id: uploadedVideoId !== undefined ? uploadedVideoId : (useExistingVideo && form.video_id ? form.video_id : undefined),
          instructor_ids: form.instructor_ids?.length ? form.instructor_ids : undefined,
        };

        const res = await courseAPI.createCourse(payload);
        const created = res.data?.data;
        const id = created?.courseId ?? created?.course_id;
        if (id) navigate(`/courses/${id}`);
      } else {
        // UPDATE course
        const id = course.course_id ?? course.courseId;
        const payload = {
          course_name: form.course_name.trim() || undefined,
          description: form.description || undefined,
          image_id: imageFile ? uploadedImageId : undefined,
          video_id: videoFile ? uploadedVideoId : (useExistingVideo && form.video_id ? form.video_id : undefined),
          alt_text: form.alt_text || undefined,
          instructor_ids: form.instructor_ids?.length ? form.instructor_ids : [],
        };

        // If video details changed but no new file uploaded, update existing video
        if (!videoFile && original.video_id && 
            (form.video_title !== original.video_title || 
             form.video_description !== original.video_description)) {
          await videoAPI.updateVideo(original.video_id, {
            title: form.video_title,
            description: form.video_description
          });
        }

        await courseAPI.updateCourse(id, payload);

        // Update existing image alt text if needed
        const trimmedNew = (form.alt_text ?? "").trim();
        const trimmedOld = (original.alt_text ?? "").trim();
        const mustUpdateExistingImageAlt =
          !imageFile &&
          original.image_id &&
          trimmedNew !== trimmedOld;

        if (mustUpdateExistingImageAlt) {
          try {
            await imageAPI.updateImage(original.image_id, {
              alt_text: trimmedNew,
              altText: trimmedNew,
            });
          } catch (err) {
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

      {/* Image Upload Section */}
      <div className="border border-border-primary rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-heading flex items-center gap-2">
          <Image className="w-4 h-4" />
          Course Image
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
      </div>

      {/* Video Upload Section */}
      <div className="border border-border-primary rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-heading flex items-center gap-2">
          <Film className="w-4 h-4" />
          Course Video
        </h3>
        
        {/* Video upload toggle */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!useExistingVideo}
              onChange={() => setUseExistingVideo(false)}
              className="accent-primary"
            />
            <span className="text-sm text-text">Upload new video</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={useExistingVideo}
              onChange={() => setUseExistingVideo(true)}
              className="accent-primary"
            />
            <span className="text-sm text-text">Use existing video ID</span>
          </label>
        </div>

        {!useExistingVideo ? (
          <>
            <div>
              <label className="block text-sm text-text mb-1">
                {isEdit ? "Upload New Video (optional)" : "Upload Video"}
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full text-sm"
              />
            </div>

            {videoPreview && (
              <div className="relative">
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-64 rounded-md border border-border-primary"
                />
                <button
                  type="button"
                  onClick={clearVideo}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {(videoFile || original.video_id) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-text mb-1">Video Title *</label>
                  <input
                    name="video_title"
                    value={form.video_title}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Course Introduction"
                    required={!!videoFile}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text mb-1">Video Description</label>
                  <input
                    name="video_description"
                    value={form.video_description}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Brief description of the video"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            <label className="block text-sm text-text mb-1">Video ID (optional)</label>
            <input
              name="video_id"
              value={form.video_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="UUID of an existing video"
            />
          </div>
        )}
      </div>

      {/* Instructors Section */}
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