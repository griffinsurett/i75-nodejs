import { useState, useEffect } from 'react';
import Modal from '../../../Modal';
import { X, Loader2, Image, Film } from 'lucide-react';
import { sectionAPI, videoAPI, uploadAPI } from '../../../../services/api';

export default function ChapterFormModal({
  isOpen,
  onClose,
  sectionId,
  chapter,
  onSuccess
}) {
  const isEdit = !!chapter;
  const [form, setForm] = useState({
    chapterNumber: '',
    title: '',
    description: '',
    content: '',
    videoId: '',
    altText: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [videos, setVideos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Load videos
      videoAPI.getAllVideos().then(res => {
        setVideos(res.data?.data || []);
      }).catch(err => console.error('Failed to load videos:', err));

      // Load existing data if editing
      if (chapter) {
        const chapterData = chapter.chapters || chapter;
        const imageData = chapter.images;
        setForm({
          chapterNumber: chapterData.chapterNumber || '',
          title: chapterData.title || '',
          description: chapterData.description || '',
          content: chapterData.content || '',
          videoId: chapterData.videoId || '',
          altText: imageData?.altText || ''
        });
        setImagePreview(imageData?.imageUrl || '');
      } else {
        // Reset for new chapter
        setForm({
          chapterNumber: '',
          title: '',
          description: '',
          content: '',
          videoId: '',
          altText: ''
        });
        setImageFile(null);
        setImagePreview('');
      }
      setError('');
    }
  }, [isOpen, chapter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.chapterNumber) return;
    
    // Add validation for sectionId
    if (!sectionId) {
      setError('Section ID is missing. Please refresh the page and try again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let imageId;
      
      // Upload image if provided
      if (imageFile) {
        const uploadRes = await uploadAPI.uploadImage(imageFile, form.altText);
        imageId = uploadRes.data?.data?.imageId;
      }

      const payload = {
        chapterNumber: parseInt(form.chapterNumber),
        title: form.title.trim(),
        description: form.description || undefined,
        content: form.content || undefined,
        videoId: form.videoId ? parseInt(form.videoId) : undefined,
        imageId: imageId || undefined,
        altText: form.altText || undefined
      };

      if (isEdit) {
        const chapterData = chapter.chapters || chapter;
        // You'll need to implement this API endpoint
        await sectionAPI.updateSectionChapter(sectionId, chapterData.chapterId, payload);
      } else {
        // You'll need to implement this API endpoint
        await sectionAPI.createSectionChapter(sectionId, payload);
      }

      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save chapter');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-heading">
            {isEdit ? 'Edit Chapter' : 'Add Chapter'}
          </h2>
          <button onClick={onClose} className="text-text hover:text-heading">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Chapter Number *
              </label>
              <input
                type="number"
                name="chapterNumber"
                value={form.chapterNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-bg2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 1"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Chapter Title *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-bg2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Introduction"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-bg2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Brief description of this chapter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Chapter Content
            </label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={8}
              className="w-full px-3 py-2 bg-bg2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="Main content of the chapter..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              <Image className="w-4 h-4 inline mr-1" />
              Chapter Image
            </label>
            <div className="flex items-start gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1 text-sm"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-md border border-border-primary"
                />
              )}
            </div>
            {(imageFile || imagePreview) && (
              <input
                name="altText"
                value={form.altText}
                onChange={handleChange}
                className="mt-2 w-full px-3 py-2 bg-bg2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="Image alt text"
              />
            )}
          </div>

          {/* Video Selection */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              <Film className="w-4 h-4 inline mr-1" />
              Chapter Video
            </label>
            <select
              name="videoId"
              value={form.videoId}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-bg2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No video</option>
              {videos.map(v => {
                const videoData = v.videos || v;
                return (
                  <option key={videoData.videoId} value={videoData.videoId}>
                    {videoData.title}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border-primary rounded-lg hover:bg-bg2"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.title.trim() || !form.chapterNumber || submitting}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Update Chapter' : 'Create Chapter'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}