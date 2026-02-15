// frontend/src/components/course/sections/content-editor/chapter/tests/QuestionsSection.jsx
import { useState, useEffect } from "react";
import { Plus, HelpCircle } from "lucide-react";
import QuestionAccordion from "./QuestionAccordion";
import { questionAPI, testAPI } from "../../../../../../services/api";

export default function QuestionsSection({ testId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  useEffect(() => {
    if (testId) {
      fetchQuestions();
    }
  }, [testId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await testAPI.getTestQuestions(testId);
      if (response.data.success) {
        setQuestions(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    try {
      const newQuestion = {
        test_id: testId,
        question_text: "New Question",
      };
      
      const response = await questionAPI.createQuestion(newQuestion);
      if (response.data.success) {
        await fetchQuestions();
        // Expand the newly created question
        setExpandedQuestionId(response.data.data.questionId);
      }
    } catch (err) {
      console.error("Failed to create question:", err);
      setError(err.message);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question? This will also delete all answer options.")) {
      return;
    }

    try {
      await questionAPI.deleteQuestion(questionId);
      await fetchQuestions();
      if (expandedQuestionId === questionId) {
        setExpandedQuestionId(null);
      }
    } catch (err) {
      console.error("Failed to delete question:", err);
      setError(err.message);
    }
  };

  const handleUpdateQuestion = async (questionId, updates) => {
    try {
      await questionAPI.updateQuestion(questionId, updates);
      await fetchQuestions();
    } catch (err) {
      console.error("Failed to update question:", err);
      setError(err.message);
    }
  };

  const toggleQuestionExpanded = (questionId) => {
    setExpandedQuestionId(expandedQuestionId === questionId ? null : questionId);
  };

  return (
    <div className="space-y-3">
      {/* Questions Header */}
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-text/60" />
        <h4 className="font-medium text-sm text-heading">
          Questions
          {questions.length > 0 && (
            <span className="ml-2 text-text/60 font-normal">
              ({questions.length})
            </span>
          )}
        </h4>
      </div>

      {loading && (
        <div className="text-sm text-text/60">Loading questions...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
          Error: {error}
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="text-sm text-text/60 bg-bg2 p-3 rounded border border-border-primary">
          No questions yet. Add a question with multiple choice answers.
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((question, index) => (
            <QuestionAccordion
              key={question.question_id}
              question={question}
              questionNumber={index + 1}
              isExpanded={expandedQuestionId === question.question_id}
              onToggle={() => toggleQuestionExpanded(question.question_id)}
              onUpdate={(updates) => handleUpdateQuestion(question.question_id, updates)}
              onDelete={() => handleDeleteQuestion(question.question_id)}
            />
          ))}
        </div>
      )}

      {/* Add Question Button */}
      <button
        type="button"
        onClick={handleAddQuestion}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-bg2 border border-dashed border-border-primary rounded hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Question
      </button>
    </div>
  );
}