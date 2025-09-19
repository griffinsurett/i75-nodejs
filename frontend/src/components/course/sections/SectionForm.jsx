// frontend/src/components/course/sections/SectionForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  sectionAPI,
  courseAPI,
  videoAPI,
  uploadAPI,
  imageAPI,
} from "../../../services/api";
import { Loader2, Film, Image } from "lucide-react";

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
    altText: "",
    videoId: "",
  });

  // Track if we're creating from within a course context
  const [courseName, setCourseName] = useState("");
  const hasPresetCourse = !isEdit && Boolean(courseIdFromUrl);

  // Image handling
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track original image for updates
  const [original, setOriginal] = useState({
    imageId: null,
    altText: "",
  });

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
          const imageData = section.images;

          setForm({
            courseId: String(sectionData.courseId || ""),
            title: sectionData.title || "",
            description: sectionData.description || "",
            altText: imageData?.altText || "",
            videoId: String(sectionData.videoId || ""),
          });

          setImagePreview(imageData?.imageUrl || "");
          setOriginal({
            imageId: sectionData.imageId,
            altText: imageData?.altText || "",
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

        // Fetch videos always
        const promises = [videoAPI.getAllVideos()];
        
        // Fetch course info based on context
        if (hasPresetCourse && courseIdFromUrl) {
          // Fetch the specific course to get its name
          promises.push(courseAPI.getCourse(courseIdFromUrl));
        } else if (!isEdit) {
          // Only fetch all courses if we need a selector
          promises.push(courseAPI.getAllCourses());
        }

        const results = await Promise.all(promises);
        setVideos(results[0].data?.data || []);
        
        if (hasPresetCourse && courseIdFromUrl && results[1]) {
          // Set course name from fetched course
          const courseData = results[1].data?.data?.courses || results[1].data?.data;
          setCourseName(courseData.courseName);
        } else if (!hasPresetCourse && results[1]) {
          // Set courses list for selector
          setCourses(results[1].data?.data || []);
        }
      } catch (err) {
        console.error("Error loading form data:", err);
        setCourses([]);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, section, courseIdFromUrl, hasPresetCourse]);

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
      let uploadedImageId;

      // Upload new image file (if chosen)
      if (imageFile) {
        const up = await uploadAPI.uploadImage(imageFile, form.altText);
        uploadedImageId = up.data?.data?.imageId;
      }

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
          imageId: uploadedImageId !== undefined ? uploadedImageId : undefined,
          videoId: form.videoId ? parseInt(form.videoId) : undefined,
        };

        const res = await courseAPI.createCourseSection(courseIdNum, payload);
        const created = res.data?.data;
        const id = created?.sectionId;
        
        // Navigate to the section under its course
        if (id) {
          navigate(`/courses/${finalCourseId}/sections/${id}`);
        }
      } else {
        // UPDATE section
        const sectionData = section.sections || section;
        const id = sectionData.sectionId;
        const courseId = sectionData.courseId || form.courseId;
        
        const payload = {
          title: form.title.trim() || undefined,
          description: form.description || undefined,
          imageId: imageFile ? uploadedImageId : undefined,
          altText: form.altText || undefined,
          videoId: form.videoId ? parseInt(form.videoId) : undefined,
        };

        await sectionAPI.updateSection(id, payload);

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

      {/* Image Upload Section */}
      <div className="border border-border-primary rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-heading flex items-center gap-2">
          <Image className="w-4 h-4" />
          Section Image
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
                  alt={form.altText || "Section image preview"}
                  className="w-full h-32 object-cover rounded-md border border-border-primary"
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

      {/* Video Selection */}
      <div className="border border-border-primary rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-heading flex items-center gap-2">
          <Film className="w-4 h-4" />
          Section Video (optional)
        </h3>
        <select
          name="videoId"
          value={form.videoId}
          onChange={handleChange}
          className="w-full rounded-lg border border-border-primary bg-bg2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">No video</option>
          {videos.map((v) => {
            const videoData = v.videos || v;
            return (
              <option key={videoData.videoId} value={videoData.videoId}>
                {videoData.title}
              </option>
            );
          })}
        </select>
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
            ? "Update Section"
            : "Create Section"}
        </button>
      </div>
    </form>
  );
}