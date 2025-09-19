// frontend/src/components/course/sections/chapters/ChapterFormModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../../Modal';
import { X, Loader2 } from 'lucide-react';
import { sectionAPI } from '../../../../services/api';
import MediaInput from '../../../media/MediaInput';

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
    imageId: null,
    videoId: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (chapter) {
        const chapterData = chapter.chapters || chapter;
        setForm({
          chapterNumber: chapterData.chapterNumber || '',
          title: chapterData.title || '',
          description: chapterData.description || '',
          content: chapterData.content || '',
          imageId: chapterData.imageId || null,
          videoId: chapterData.videoId || null,
        });
      } else {
        // Reset for new chapter
        setForm({
          chapterNumber: '',
          title: '',
          description: '',
          content: '',
          imageId: null,
          videoId: null,
        });
      }
      setError('');
    }
  }, [isOpen, chapter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.chapterNumber) return;
    
    if (!sectionId) {
      setError('Section ID is missing. Please refresh the page and try again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        chapterNumber: parseInt(form.chapterNumber),
        title: form.title.trim(),
        description: form.description || undefined,
        content: form.content || undefined,
        imageId: form.imageId || undefined,
        videoId: form.videoId || undefined,
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

          {/* Chapter Image - Using MediaInput */}
          <MediaInput
            label="Chapter Image"
            value={form.imageId}
            onChange={(imageId) => setForm(f => ({ ...f, imageId }))}
            mediaType="image"
            placeholder="Select or upload chapter image"
            showPreview={true}
          />

          {/* Chapter Video - Using MediaInput */}
          <MediaInput
            label="Chapter Video"
            value={form.videoId}
            onChange={(videoId) => setForm(f => ({ ...f, videoId }))}
            mediaType="video"
            placeholder="Select or upload chapter video"
            showPreview={true}
          />

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