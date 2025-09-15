// ==================== frontend/src/services/api.js ====================
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:1111/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to ${config.url}`
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Course API functions
export const courseAPI = {
  // Get all courses
  getAllCourses: (params = {}) => api.get('/courses', { params }),

  // Get single course by ID
  getCourse: (courseId) => api.get(`/courses/${courseId}`),

  // Get course sections
  getCourseSections: (courseId) => api.get(`/courses/${courseId}/sections`),

  // Create new course
  createCourse: (courseData) => api.post("/courses", courseData),

  // Update course
  updateCourse: (courseId, courseData) =>
    api.put(`/courses/${courseId}`, courseData),

  // Archive (soft delete until restored)
  archiveCourse: (courseId) => api.post(`/courses/${courseId}/archive`),

  // Restore an archived course
  restoreCourse: (courseId) => api.post(`/courses/${courseId}/restore`),

  // Delete course
  deleteCourse: (courseId) => api.delete(`/courses/${courseId}`),
};

// Instructor API functions
export const instructorAPI = {
  getAllInstructors: () => api.get("/instructors"),
  getInstructor: (instructorId) => api.get(`/instructors/${instructorId}`),
  getInstructorCourses: (instructorId) =>
    api.get(`/instructors/${instructorId}/courses`),
  createInstructor: (instructorData) =>
    api.post("/instructors", instructorData),
  updateInstructor: (instructorId, instructorData) =>
    api.put(`/instructors/${instructorId}`, instructorData),
  deleteInstructor: (instructorId) =>
    api.delete(`/instructors/${instructorId}`),
};

// Section API functions
export const sectionAPI = {
  getAllSections: () => api.get("/sections"),
  getSection: (sectionId) => api.get(`/sections/${sectionId}`),
  getSectionChapters: (sectionId) => api.get(`/sections/${sectionId}/chapters`),
  createSection: (sectionData) => api.post("/sections", sectionData),
  updateSection: (sectionId, sectionData) =>
    api.put(`/sections/${sectionId}`, sectionData),
  deleteSection: (sectionId) => api.delete(`/sections/${sectionId}`),
};

// Chapter API functions
export const chapterAPI = {
  getAllChapters: () => api.get("/chapters"),
  getChapter: (chapterId) => api.get(`/chapters/${chapterId}`),
  getChapterTests: (chapterId) => api.get(`/chapters/${chapterId}/tests`),
  getChapterEntries: (chapterId) => api.get(`/chapters/${chapterId}/entries`),
  createChapter: (chapterData) => api.post("/chapters", chapterData),
  updateChapter: (chapterId, chapterData) =>
    api.put(`/chapters/${chapterId}`, chapterData),
  deleteChapter: (chapterId) => api.delete(`/chapters/${chapterId}`),
};

// Test API functions
export const testAPI = {
  getAllTests: () => api.get("/tests"),
  getTest: (testId) => api.get(`/tests/${testId}`),
  getTestQuestions: (testId) => api.get(`/tests/${testId}/questions`),
  createTest: (testData) => api.post("/tests", testData),
  updateTest: (testId, testData) => api.put(`/tests/${testId}`, testData),
  deleteTest: (testId) => api.delete(`/tests/${testId}`),
};

// Question API functions
export const questionAPI = {
  getAllQuestions: () => api.get("/questions"),
  getQuestion: (questionId) => api.get(`/questions/${questionId}`),
  getQuestionOptions: (questionId) =>
    api.get(`/questions/${questionId}/options`),
  createQuestion: (questionData) => api.post("/questions", questionData),
  updateQuestion: (questionId, questionData) =>
    api.put(`/questions/${questionId}`, questionData),
  deleteQuestion: (questionId) => api.delete(`/questions/${questionId}`),
};

// Image API functions
export const imageAPI = {
  getAllImages: () => api.get("/images"),
  getImage: (imageId) => api.get(`/images/${imageId}`),
  getImageUsage: (imageId) => api.get(`/images/${imageId}/usage`),
  createImage: (imageData) => api.post("/images", imageData),
  bulkCreateImages: (imagesData) => api.post("/images/bulk", imagesData),
  updateImage: (imageId, imageData) => api.put(`/images/${imageId}`, imageData),
  deleteImage: (imageId) => api.delete(`/images/${imageId}`),
};

// Video API functions
export const videoAPI = {
  getAllVideos: () => api.get("/videos"),
  getVideo: (videoId) => api.get(`/videos/${videoId}`),
  createVideo: (videoData) => api.post("/videos", videoData),
  updateVideo: (videoId, videoData) => api.put(`/videos/${videoId}`, videoData),
  deleteVideo: (videoId) => api.delete(`/videos/${videoId}`),
  // NEW: Upload video
  uploadVideo: (file, title, description) => {
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    if (description) form.append("description", description);

    return api.post("/videos/upload", form, {
      onUploadProgress: (progressEvent) => {
        console.log("Video upload progress:", progressEvent);
      },
    });
  },
};

// Upload API functions
export const uploadAPI = {
  uploadImage: (file, alt_text) => {
    console.log("uploadImage called with:", { file, alt_text });

    const form = new FormData();
    form.append("file", file);
    if (alt_text) form.append("alt_text", alt_text);

    console.log("FormData entries:");
    for (let pair of form.entries()) {
      console.log(pair[0], pair[1]);
    }

    return api.post("/images/upload", form, {
      onUploadProgress: (progressEvent) => {
        console.log("Upload progress:", progressEvent);
      },
    });
  },
  
  // NEW: Upload video (alternative location for consistency)
  uploadVideo: (file, title, description) => {
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    if (description) form.append("description", description);

    return api.post("/videos/upload", form, {
      onUploadProgress: (progressEvent) => {
        console.log("Video upload progress:", progressEvent);
      },
    });
  },
};

export default api;