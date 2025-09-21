// frontend/src/components/course/sections/edit/SectionEditor.jsx
import { useState, useEffect } from 'react';
import { Save, Loader2, Settings } from 'lucide-react';
import { sectionAPI } from '../../../../services/api';
import { FormField, FormInput, FormTextarea } from '../../../forms';
import MediaInput from '../../../media/MediaInput';

export default function SectionEditor({ section, onUpdate, onDataChange }) {
  const sectionData = section.sections || section;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageId: null,
    videoId: null,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when section changes
  useEffect(() => {
    setFormData({
      title: sectionData.title || '',
      description: sectionData.description || '',
      imageId: sectionData.imageId || null,
      videoId: sectionData.videoId || null,
    });
    setHasChanges(false);
  }, [section]);

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
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        imageId: formData.imageId || undefined,
        videoId: formData.videoId || undefined,
      };

      const response = await sectionAPI.updateSection(sectionData.sectionId, updateData);
      
      if (response.data?.success) {
        onUpdate(response.data.data);
        setHasChanges(false);
      } else {
        throw new Error('Failed to update section');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
      console.error('Error saving section:', err);
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
    <div className="max-w-4xl mx-auto" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-heading">Section Settings</h2>
            <p className="text-sm text-text/70">Configure section details and media</p>
          </div>
        </div>

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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
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
          
          <FormField
            label="Section Title"
            required
          >
            <FormInput
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g., Getting Started"
              className="text-lg"
            />
          </FormField>

          <FormField
            label="Description"
            help="What will students learn in this section?"
          >
            <FormTextarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Describe the section content..."
              rows={4}
            />
          </FormField>
        </div>

        {/* Media */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-heading border-b border-border-primary pb-2">
            Media
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MediaInput
              label="Section Image"
              value={formData.imageId}
              onChange={(imageId) => handleFieldChange('imageId', imageId)}
              mediaType="image"
              placeholder="Select or upload section image"
              showPreview={true}
            />

            <MediaInput
              label="Section Video"
              value={formData.videoId}
              onChange={(videoId) => handleFieldChange('videoId', videoId)}
              mediaType="video"
              placeholder="Select or upload section video"
              showPreview={true}
            />
          </div>
        </div>

        {/* Save Hint */}
        {hasChanges && (
          <div className="flex items-center gap-2 text-sm text-text/70 bg-bg2 p-3 rounded-lg">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>You have unsaved changes. Press Ctrl+S or click Save Changes to save.</span>
          </div>
        )}
      </div>

      {/* Section Info */}
      <div className="mt-6 p-4 bg-bg2 rounded-lg">
        <h4 className="text-sm font-medium text-heading mb-2">Section Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-text/70">
          <div>
            <div className="font-medium">Section ID</div>
            <div className="font-mono">{sectionData.sectionId}</div>
          </div>
          <div>
            <div className="font-medium">Course ID</div>
            <div className="font-mono">{sectionData.courseId}</div>
          </div>
          <div>
            <div className="font-medium">Created</div>
            <div>{new Date(sectionData.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="font-medium">Updated</div>
            <div>{new Date(sectionData.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}