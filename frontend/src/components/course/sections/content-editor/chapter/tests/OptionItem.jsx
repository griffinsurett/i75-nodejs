// frontend/src/components/course/sections/content-editor/chapter/tests/OptionItem.jsx
import { useState } from "react";
import { Trash2, CheckCircle2, Circle } from "lucide-react";
import { FormInput, FormTextarea } from "../../../../../forms";
import MediaInput from "../../../../../media/selection/MediaInput";

export default function OptionItem({ 
  option, 
  optionLetter, 
  onUpdate, 
  onDelete, 
  onToggleCorrect 
}) {
  const [formData, setFormData] = useState({
    optionText: option.option_text || "",
    explanation: option.explanation || "",
    videoId: option.video_id || null,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (hasChanges) {
      onUpdate({
        option_text: formData.optionText,
        explanation: formData.explanation,
        video_id: formData.videoId,
      });
      setHasChanges(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <div 
      className={`
        border rounded p-3 space-y-2 transition-colors
        ${option.is_correct 
          ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
          : 'border-border-primary bg-bg'
        }
      `}
    >
      {/* Option Header */}
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onToggleCorrect}
          className="mt-1 flex-shrink-0 hover:scale-110 transition-transform"
          title={option.is_correct ? "Mark as incorrect" : "Mark as correct"}
        >
          {option.is_correct ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-text/40" />
          )}
        </button>

        <div className="flex-1 space-y-2">
          {/* Option Text */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text/60 flex-shrink-0 w-6">
              {optionLetter}.
            </span>
            <FormInput
              value={formData.optionText}
              onChange={(e) => handleFieldChange("optionText", e.target.value)}
              onBlur={handleBlur}
              placeholder="Enter answer choice..."
              className="text-sm flex-1"
            />
          </div>

          {/* Explanation */}
          <FormTextarea
            value={formData.explanation}
            onChange={(e) => handleFieldChange("explanation", e.target.value)}
            onBlur={handleBlur}
            placeholder="Optional: Explain why this answer is correct/incorrect..."
            rows={2}
            className="text-xs"
          />

          {/* Video Explanation */}
          <MediaInput
            label="Video Explanation"
            value={formData.videoId}
            onChange={(videoId) => {
              handleFieldChange("videoId", videoId);
              handleSave();
            }}
            mediaType="video"
            placeholder="Optional: Add video explanation"
            showPreview={false}
            compact={true}
          />

          {/* Correct Answer Badge */}
          {option.is_correct && (
            <div className="text-xs text-green-700 dark:text-green-400 font-medium">
              ✓ Correct Answer
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="mt-1 p-1 text-text/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
          title="Delete option"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Save indicator */}
      {hasChanges && (
        <div className="text-xs text-orange-600 flex items-center gap-1 pl-7">
          <span>●</span>
          <span>Unsaved changes - will save on blur</span>
        </div>
      )}
    </div>
  );
}