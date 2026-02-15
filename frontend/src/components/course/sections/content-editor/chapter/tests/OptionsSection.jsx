// frontend/src/components/course/sections/content-editor/chapter/tests/OptionsSection.jsx
import { useState, useEffect } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import OptionItem from "./OptionItem";
import { optionAPI, questionAPI } from "../../../../../../services/api";

export default function OptionsSection({ questionId }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (questionId) {
      fetchOptions();
    }
  }, [questionId]);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questionAPI.getQuestionOptions(questionId);
      if (response.data.success) {
        setOptions(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch options:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = async () => {
    try {
      const optionLetter = String.fromCharCode(65 + options.length); // A, B, C, D...
      
      const newOption = {
        question_id: questionId,
        option_text: `Option ${optionLetter}`,
        is_correct: false,
        explanation: "",
      };
      
      const response = await optionAPI.createOption(newOption);
      if (response.data.success) {
        await fetchOptions();
      }
    } catch (err) {
      console.error("Failed to create option:", err);
      setError(err.message);
    }
  };

  const handleDeleteOption = async (optionId) => {
    try {
      await optionAPI.deleteOption(optionId);
      await fetchOptions();
    } catch (err) {
      console.error("Failed to delete option:", err);
      setError(err.message);
    }
  };

  const handleUpdateOption = async (optionId, updates) => {
    try {
      await optionAPI.updateOption(optionId, updates);
      await fetchOptions();
    } catch (err) {
      console.error("Failed to update option:", err);
      setError(err.message);
    }
  };

  const handleToggleCorrect = async (optionId, currentIsCorrect) => {
    await handleUpdateOption(optionId, { is_correct: !currentIsCorrect });
  };

  return (
    <div className="space-y-2">
      {/* Options Header */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-text/60" />
        <h5 className="font-medium text-sm text-heading">
          Answer Choices
          {options.length > 0 && (
            <span className="ml-2 text-text/60 font-normal">
              ({options.length})
            </span>
          )}
        </h5>
      </div>

      {loading && (
        <div className="text-sm text-text/60">Loading options...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          Error: {error}
        </div>
      )}

      {!loading && options.length === 0 && (
        <div className="text-sm text-text/60 bg-bg2 p-2 rounded border border-border-primary">
          No answer choices yet. Add at least one correct answer.
        </div>
      )}

      {!loading && options.length > 0 && (
        <div className="space-y-2">
          {options.map((option, index) => (
            <OptionItem
              key={option.option_id}
              option={option}
              optionLetter={String.fromCharCode(65 + index)}
              onUpdate={(updates) => handleUpdateOption(option.option_id, updates)}
              onDelete={() => handleDeleteOption(option.option_id)}
              onToggleCorrect={() => handleToggleCorrect(option.option_id, option.is_correct)}
            />
          ))}
        </div>
      )}

      {/* Add Option Button */}
      {!loading && options.length < 10 && (
        <button
          type="button"
          onClick={handleAddOption}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-bg2 border border-dashed border-border-primary rounded hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Answer Choice
        </button>
      )}

      {options.length >= 10 && (
        <div className="text-xs text-text/60 text-center">
          Maximum 10 answer choices reached
        </div>
      )}
    </div>
  );
}