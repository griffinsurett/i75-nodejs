// frontend/src/components/course/sections/content-editor/chapter/tests/TestAccordion.jsx
import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2, GripVertical } from "lucide-react";
import { FormField, FormInput, FormTextarea } from "../../../../../forms";
import MediaInput from "../../../../../media/selection/MediaInput";
import QuestionsSection from "./QuestionsSection";

export default function TestAccordion({ 
  test, 
  isExpanded, 
  onToggle, 
  onUpdate, 
  onDelete 
}) {
  const [formData, setFormData] = useState({
    title: test.title || "",
    description: test.description || "",
    imageId: test.image_id || null,
    videoId: test.video_id || null,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (hasChanges) {
      onUpdate({
        title: formData.title,
        description: formData.description,
        image_id: formData.imageId,
        video_id: formData.videoId,
      });
      setHasChanges(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <div className="border border-border-primary rounded-lg overflow-hidden bg-bg">
      {/* Test Header */}
      <div className="flex items-center gap-2 p-3 bg-bg2 border-b border-border-primary">
        <button
          type="button"
          className="flex-1 flex items-center gap-2 text-left hover:text-primary transition-colors"
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )}
          <GripVertical className="w-4 h-4 flex-shrink-0 text-text/40" />
          <span className="font-medium text-sm truncate">
            {formData.title || "Untitled Test"}
          </span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-text/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Delete test"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Test Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <FormField label="Test Title" required>
              <FormInput
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                onBlur={handleBlur}
                placeholder="e.g., Chapter 1 Quiz"
                className="text-sm"
              />
            </FormField>

            <FormField label="Description">
              <FormTextarea
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                onBlur={handleBlur}
                placeholder="Describe what this test covers..."
                rows={2}
                className="text-sm"
              />
            </FormField>

            {/* Media */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MediaInput
                label="Test Image"
                value={formData.imageId}
                onChange={(imageId) => {
                  handleFieldChange("imageId", imageId);
                  handleSave();
                }}
                mediaType="image"
                placeholder="Select test image"
                showPreview={true}
              />

              <MediaInput
                label="Test Video"
                value={formData.videoId}
                onChange={(videoId) => {
                  handleFieldChange("videoId", videoId);
                  handleSave();
                }}
                mediaType="video"
                placeholder="Select test video"
                showPreview={true}
              />
            </div>
          </div>

          {/* Save indicator */}
          {hasChanges && (
            <div className="text-xs text-orange-600 flex items-center gap-1">
              <span>●</span>
              <span>Unsaved changes - will save on blur</span>
            </div>
          )}

          {/* Questions Section */}
          <div className="border-t border-border-primary pt-4">
            <QuestionsSection testId={test.test_id} />
          </div>
        </div>
      )}
    </div>
  );
}