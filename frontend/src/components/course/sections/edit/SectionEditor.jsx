// frontend/src/components/course/sections/edit/SectionEditor.jsx
import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { FormField, FormInput, FormTextarea } from '../../../forms';
import MediaInput from '../../../media/MediaInput';

export default function SectionEditor({ section, onUpdate }) {
  const sectionData = section.sections || section;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageId: null,
    videoId: null,
  });

  // Initialize form data when section changes
  useEffect(() => {
    setFormData({
      title: sectionData.title || '',
      description: sectionData.description || '',
      imageId: sectionData.imageId || null,
      videoId: sectionData.videoId || null,
    });
  }, [section]);

  const handleFieldChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    // Immediately notify parent of changes
    onUpdate(newData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header - No save button here anymore */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-heading">Section Settings</h2>
          <p className="text-sm text-text/70">Configure section details and media</p>
        </div>
      </div>

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