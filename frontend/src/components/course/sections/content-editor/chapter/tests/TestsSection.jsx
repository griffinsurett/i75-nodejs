// frontend/src/components/course/sections/content-editor/chapter/tests/TestsSection.jsx
import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronUp, ListChecks } from "lucide-react";
import TestAccordion from "./TestAccordion";
import { chapterAPI, testAPI } from "../../../../../../services/api";

export default function TestsSection({ 
  chapterId, 
  disabled = false,
  onUpdate 
}) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState(null);

  useEffect(() => {
    if (chapterId && !disabled) {
      fetchTests();
    }
  }, [chapterId, disabled]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chapterAPI.getChapterTests(chapterId);
      if (response.data.success) {
        setTests(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async () => {
    try {
      const newTest = {
        chapter_id: chapterId,
        title: "New Test",
        description: "",
      };
      
      const response = await testAPI.createTest(newTest);
      if (response.data.success) {
        await fetchTests();
        // Expand the newly created test
        setExpandedTestId(response.data.data.testId);
        setIsOpen(true);
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error("Failed to create test:", err);
      setError(err.message);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Are you sure you want to delete this test? This will also delete all questions and options.")) {
      return;
    }

    try {
      await testAPI.deleteTest(testId);
      await fetchTests();
      if (expandedTestId === testId) {
        setExpandedTestId(null);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to delete test:", err);
      setError(err.message);
    }
  };

  const handleUpdateTest = async (testId, updates) => {
    try {
      await testAPI.updateTest(testId, updates);
      await fetchTests();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to update test:", err);
      setError(err.message);
    }
  };

  const toggleTestExpanded = (testId) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Tests Header - Accordion Style */}
      <div className="border-t border-border-primary pt-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-lg font-semibold text-heading hover:text-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            <span>Tests & Questions</span>
            {tests.length > 0 && (
              <span className="text-sm font-normal text-text/60">
                ({tests.length})
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Tests Content */}
      {isOpen && (
        <div className="space-y-3 pl-4">
          {loading && (
            <div className="text-sm text-text/60">Loading tests...</div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
              Error: {error}
            </div>
          )}

          {!loading && tests.length === 0 && (
            <div className="text-sm text-text/60 bg-bg2 p-4 rounded border border-border-primary">
              No tests yet. Add a test to include questions and answer choices.
            </div>
          )}

          {!loading && tests.length > 0 && (
            <div className="space-y-2">
              {tests.map((test) => (
                <TestAccordion
                  key={test.test_id}
                  test={test}
                  isExpanded={expandedTestId === test.test_id}
                  onToggle={() => toggleTestExpanded(test.test_id)}
                  onUpdate={(updates) => handleUpdateTest(test.test_id, updates)}
                  onDelete={() => handleDeleteTest(test.test_id)}
                />
              ))}
            </div>
          )}

          {/* Add Test Button */}
          <button
            type="button"
            onClick={handleAddTest}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-bg2 border-2 border-dashed border-border-primary rounded hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Test
          </button>
        </div>
      )}
    </div>
  );
}