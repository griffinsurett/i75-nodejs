// CourseForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseAPI, instructorAPI, uploadAPI, imageAPI, videoAPI } from "../services/api";
import { Loader2, X, Film, Image } from "lucide-react";

export default function CourseForm({ mode = "create", course }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    courseName: "",
    description: "",
    altText: "",
    videoTitle: "",
    videoDescription: "",
    videoId: "",
    instructorIds: [],
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
    imageId: null, 
    altText: "",
    videoId: null,
    videoUrl: "",
    videoTitle: "",
    videoDescription: ""
  });

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
          // Extract nested data
          const courseData = course.courses || course;
          const imageData = course.images;
          const videoData = course.videos;
          
          setForm({
            courseName: courseData.courseName || "",
            description: courseData.description || "",
            altText: imageData?.altText || "",
            videoId: courseData.videoId || "",
            videoTitle: videoData?.title || "",
            videoDescription: videoData?.description || "",
            instructorIds: courseData.instructors?.map((i) => (i.instructors || i).instructorId) || [],
          });
          
          setImagePreview(imageData?.imageUrl || "");
          setOriginal({ 
            imageId: courseData.imageId, 
            altText: imageData?.altText || "",
            videoId: courseData.videoId,
            videoTitle: videoData?.title || "",
            videoDescription: videoData?.description || ""
          });
        } else {
          setForm({
            courseName: "",
            description: "",
            altText: "",
            videoId: "",
            videoTitle: "",
            videoDescription: "",
            instructorIds: [],
          });
          setImagePreview("");
          setOriginal({ 
            imageId: null, 
            altText: "",
            videoId: null,
            videoTitle: "",
            videoDescription: ""
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
    setForm(f => ({ ...f, videoTitle: "", videoDescription: "" }));
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
      let uploadedImageId;
      let uploadedVideoId;

      // Upload new image file (if chosen)
      if (imageFile) {
        const up = await uploadAPI.uploadImage(imageFile, form.altText);
        uploadedImageId = up.data?.data?.imageId;
      }

      // Upload new video file (if chosen)
      if (videoFile && form.videoTitle) {
        const videoUp = await uploadAPI.uploadVideo(videoFile, form.videoTitle, form.videoDescription);
        uploadedVideoId = videoUp.data?.data?.videoId;
      }

      if (!isEdit) {
        // CREATE course - use camelCase
        const payload = {
          courseName: form.courseName.trim(),
          description: form.description || undefined,
          imageId: uploadedImageId !== undefined ? uploadedImageId : undefined,
          videoId: uploadedVideoId !== undefined ? uploadedVideoId : (useExistingVideo && form.videoId ? form.videoId : undefined),
          instructorIds: form.instructorIds?.length ? form.instructorIds : undefined,
        };

        const res = await courseAPI.createCourse(payload);
        const created = res.data?.data;
        const id = created?.courseId;
        if (id) navigate(`/courses/${id}`);
      } else {
        // UPDATE course - use camelCase
        const courseData = course.courses || course;
        const id = courseData.courseId;
        const payload = {
          courseName: form.courseName.trim() || undefined,
          description: form.description || undefined,
          imageId: imageFile ? uploadedImageId : undefined,
          videoId: videoFile ? uploadedVideoId : (useExistingVideo && form.videoId ? form.videoId : undefined),
          altText: form.altText || undefined,
          instructorIds: form.instructorIds?.length ? form.instructorIds : [],
        };

        // If video details changed but no new file uploaded, update existing video
        if (!videoFile && original.videoId && 
            (form.videoTitle !== original.videoTitle || 
             form.videoDescription !== original.videoDescription)) {
          await videoAPI.updateVideo(original.videoId, {
            title: form.videoTitle,
            description: form.videoDescription
          });
        }

        await courseAPI.updateCourse(id, payload);

        // Update existing image alt text if needed
        const trimmedNew = (form.altText ?? "").trim();
        const trimmedOld = (original.altText ?? "").trim();
        const mustUpdateExistingImageAlt =
          !imageFile &&
          original.imageId &&
          trimmedNew !== trimmedOld;

        if (mustUpdateExistingImageAlt) {
          try {
            await imageAPI.updateImage(original.imageId, {
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
                  alt={form.altText || "Course image preview"}
                  className="w-full h-32 object-cover rounded-md border border-border-primary"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-text mb-1">Image Alt Text</label>
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

            {(videoFile || original.videoId) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-text mb-1">Video Title *</label>
                  <input
                    name="videoTitle"
                    value={form.videoTitle}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Course Introduction"
                    required={!!videoFile}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text mb-1">Video Description</label>
                  <input
                    name="videoDescription"
                    value={form.videoDescription}
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
              name="videoId"
              value={form.videoId}
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
                    <label htmlFor={`inst-${instructorData.instructorId}`} className="text-sm text-text">
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
          {submitting ? (isEdit ? "Updating…" : "Creating…") : isEdit ? "Update Course" : "Create Course"}
        </button>
      </div>
    </form>
  );
}