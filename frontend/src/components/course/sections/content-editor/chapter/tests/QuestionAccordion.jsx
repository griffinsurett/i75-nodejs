// frontend/src/components/course/sections/content-editor/chapter/tests/QuestionAccordion.jsx
import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { FormField, FormTextarea } from "../../../../../forms";
import OptionsSection from "./OptionsSection";

export default function QuestionAccordion({ 
  question, 
  questionNumber,
  isExpanded, 
  onToggle, 
  onUpdate, 
  onDelete 
}) {
  const [formData, setFormData] = useState({
    questionText: question.question_text || "",
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (hasChanges) {
      onUpdate({
        question_text: formData.questionText,
      });
      setHasChanges(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <div className="border border-border-primary rounded overflow-hidden bg-bg">
      {/* Question Header */}
      <div className="flex items-center gap-2 p-2 bg-bg2 border-b border-border-primary">
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
          <span className="text-xs font-medium text-text/60 flex-shrink-0">
            Q{questionNumber}
          </span>
          <span className="text-sm truncate">
            {formData.questionText || "Untitled Question"}
          </span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-text/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Delete question"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Question Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Question Text */}
          <FormField label="Question" required>
            <FormTextarea
              value={formData.questionText}
              onChange={(e) => handleFieldChange("questionText", e.target.value)}
              onBlur={handleBlur}
              placeholder="Enter your question here..."
              rows={3}
              className="text-sm"
            />
          </FormField>

          {/* Save indicator */}
          {hasChanges && (
            <div className="text-xs text-orange-600 flex items-center gap-1">
              <span>●</span>
              <span>Unsaved changes - will save on blur</span>
            </div>
          )}

          {/* Answer Options Section */}
          <div className="border-t border-border-primary pt-3">
            <OptionsSection questionId={question.question_id} />
          </div>
        </div>
      )}
    </div>
  );
}