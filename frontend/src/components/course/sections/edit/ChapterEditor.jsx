// frontend/src/components/course/sections/edit/ChapterEditor.jsx
import { useState, useEffect } from 'react';
import { Save, Loader2, BookOpen, Trash2 } from 'lucide-react';
import { sectionAPI } from '../../../../services/api';
import { FormField, FormInput, FormTextarea } from '../../../forms';
import MediaInput from '../../../media/MediaInput';
import ConfirmModal from '../../../ConfirmModal';

export default function ChapterEditor({ sectionId, chapter, onUpdate, onDelete, onDataChange }) {
  const chapterData = chapter.chapters || chapter;
  
  const [formData, setFormData] = useState({
    chapterNumber: '',
    title: '',
    description: '',
    content: '',
    imageId: null,
    videoId: null,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Initialize form data when chapter changes
  useEffect(() => {
    setFormData({
      chapterNumber: String(chapterData.chapterNumber || ''),
      title: chapterData.title || '',
      description: chapterData.description || '',
      content: chapterData.content || '',
      imageId: chapterData.imageId || null,
      videoId: chapterData.videoId || null,
    });
    setHasChanges(false);
  }, [chapter]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    onDataChange();
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      setError('');

      const updateData = {
        chapterNumber: parseInt(formData.chapterNumber),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        content: formData.content.trim() || undefined,
        imageId: formData.imageId || undefined,
        videoId: formData.videoId || undefined,
      };

      const response = await sectionAPI.updateSectionChapter(
        sectionId, 
        chapterData.chapterId, 
        updateData
      );
      
      if (response.data?.success) {
        onUpdate(response.data.data);
        setHasChanges(false);
      } else {
        throw new Error('Failed to update chapter');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
      console.error('Error saving chapter:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      setError('');

      await sectionAPI.deleteSectionChapter(sectionId, chapterData.chapterId);
      onDelete();
      setDeleteModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete chapter');
      console.error('Error deleting chapter:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-heading">
                Chapter {chapterData.chapterNumber}: {chapterData.title || 'Untitled'}
              </h2>
              <p className="text-sm text-text/70">Edit chapter content and settings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasChanges
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-bg2 text-text/60 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Chapter'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-bg rounded-xl border border-border-primary p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-heading border-b border-border-primary pb-2">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Chapter Number"
                required
              >
                <FormInput
                  type="number"
                  value={formData.chapterNumber}
                  onChange={(e) => handleFieldChange('chapterNumber', e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField
                  label="Chapter Title"
                  required
                >
                  <FormInput
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="e.g., Introduction"
                    className="text-lg"
                  />
                </FormField>
              </div>
            </div>

            <FormField
              label="Description"
              help="Brief description of what this chapter covers"
            >
              <FormTextarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Describe what students will learn in this chapter..."
                rows={3}
              />
            </FormField>
          </div>

          {/* Chapter Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-heading border-b border-border-primary pb-2">
              Chapter Content
            </h3>
            
            <FormField
              label="Content"
              help="Main content of the chapter - you can use markdown formatting"
            >
              <FormTextarea
                value={formData.content}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                placeholder="Enter the chapter content here..."
                rows={12}
                className="font-mono text-sm"
              />
            </FormField>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-heading border-b border-border-primary pb-2">
              Chapter Media
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MediaInput
                label="Chapter Image"
                value={formData.imageId}
                onChange={(imageId) => handleFieldChange('imageId', imageId)}
                mediaType="image"
                placeholder="Select or upload chapter image"
                showPreview={true}
              />

              <MediaInput
                label="Chapter Video"
                value={formData.videoId}
                onChange={(videoId) => handleFieldChange('videoId', videoId)}
                mediaType="video"
                placeholder="Select or upload chapter video"
                showPreview={true}
              />
            </div>
          </div>

          {/* Save Hint */}
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-text/70 bg-bg2 p-3 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>You have unsaved changes. Press Ctrl+S or click Save Chapter to save.</span>
            </div>
          )}
        </div>

        {/* Chapter Info */}
        <div className="mt-6 p-4 bg-bg2 rounded-lg">
          <h4 className="text-sm font-medium text-heading mb-2">Chapter Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-text/70">
            <div>
              <div className="font-medium">Chapter ID</div>
              <div className="font-mono">{chapterData.chapterId}</div>
            </div>
            <div>
              <div className="font-medium">Section ID</div>
              <div className="font-mono">{sectionId}</div>
            </div>
            <div>
              <div className="font-medium">Created</div>
              <div>{new Date(chapterData.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="font-medium">Updated</div>
              <div>{new Date(chapterData.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Chapter?"
        description={`Are you sure you want to delete "${chapterData.title}"? This action cannot be undone and will permanently remove all chapter content.`}
        confirmLabel="Delete Chapter"
        confirmClass="bg-red-600"
        onConfirm={handleDelete}
        busy={saving}
        error={error}
      />
    </>
  );
}