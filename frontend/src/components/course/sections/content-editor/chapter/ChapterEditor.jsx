// frontend/src/components/course/sections/content-editor/chapter/ChapterEditor.jsx
import { useState, useEffect } from "react";
import { BookOpen, Trash2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { FormField, FormInput, FormTextarea } from "../../../../forms";
import MediaInput from "../../../../media/selection/MediaInput";
import ChapterDeletionBadge from "./ChapterDeletionBadge";
import StatusIndicator from "../../../../common/StatusIndicator";
import NumberBadge from "../../../../common/NumberBadge";

export default function ChapterEditor({
  sectionId,
  chapter,
  chapters,
  onUpdate,
  onDelete,
  onUndoDelete,
  onRestoreArchived,
  isTemp = false,
}) {
  const chapterData = chapter.chapters || chapter;
  const isPendingDeletion = chapter.pendingDeletion;
  const isArchived = chapterData.isArchived;
  const hasScheduledDeletion =
    chapterData.purgeAfterAt || chapterData.scheduledDeleteAt;

  // Accordion state - open by default for new chapters, closed for existing
  const [basicInfoOpen, setBasicInfoOpen] = useState(isTemp);

  const [formData, setFormData] = useState({
    chapterNumber: "",
    title: "",
    description: "",
    imageId: null,
    videoId: null,
  });

  useEffect(() => {
    setFormData({
      chapterNumber: String(chapterData.chapterNumber || ""),
      title: chapterData.title || "",
      description: chapterData.description || "",
      imageId: chapterData.imageId || null,
      videoId: chapterData.videoId || null,
    });
  }, [chapter]);

  const handleFieldChange = (field, value) => {
    if (isPendingDeletion || isArchived) return;

    if (field === "chapterNumber") {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue > 0) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        onUpdate({ chapterNumber: numValue });
      } else if (value === "") {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    onUpdate({ [field]: value });
  };

  const handleKeyDown = (e) => {
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  };

  const getHeaderColor = () => {
    if (isPendingDeletion || (isArchived && hasScheduledDeletion)) {
      return "bg-red-100 dark:bg-red-900/20";
    }
    if (isArchived) {
      return "bg-yellow-100 dark:bg-yellow-900/20";
    }
    return "bg-primary/10";
  };

  const getIconColor = () => {
    if (isPendingDeletion || (isArchived && hasScheduledDeletion)) {
      return "text-red-600";
    }
    if (isArchived) {
      return "text-yellow-600";
    }
    return "text-primary";
  };

  const getTitleStyle = () => {
    if (isPendingDeletion || (isArchived && hasScheduledDeletion)) {
      return "text-red-600 line-through";
    }
    if (isArchived) {
      return "text-yellow-600";
    }
    return "text-heading";
  };

  const getSubtitle = () => {
    if (isPendingDeletion) return "This chapter will be deleted when you save";
    if (isArchived && hasScheduledDeletion)
      return "This chapter is scheduled for deletion";
    if (isArchived) return "This chapter is archived";
    return "Edit chapter content and settings";
  };

  const getStatusType = () => {
    if (isPendingDeletion) return "pendingDeletion";
    if (isArchived && hasScheduledDeletion) return "scheduledDeletion";
    if (isArchived) return "archived";
    if (isTemp) return "unsaved";
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getHeaderColor()}`}>
            <BookOpen className={`w-5 h-5 ${getIconColor()}`} />
          </div>
          <div className="flex items-center gap-2">
            <NumberBadge
              number={formData.chapterNumber || chapterData.chapterNumber}
              variant={
                isPendingDeletion || (isArchived && hasScheduledDeletion)
                  ? "danger"
                  : isArchived
                  ? "warning"
                  : "primary"
              }
              size="sm"
            />
            <div>
              <h2
                className={`text-xl font-bold ${getTitleStyle()} flex items-center gap-2`}
              >
                {formData.title || "Untitled"}
                {getStatusType() && (
                  <StatusIndicator
                    status={getStatusType()}
                    label={isTemp ? "New" : undefined}
                    size="xs"
                    showIcon={!isTemp}
                    className="inline-flex"
                  />
                )}
              </h2>
              <p className="text-sm text-text/70">{getSubtitle()}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isPendingDeletion ? (
          <ChapterDeletionBadge
            deletedAt={chapter.deletedAt}
            scheduledDeleteAt={null}
            onUndo={onUndoDelete}
            isPending={true}
          />
        ) : isArchived && hasScheduledDeletion ? (
          <ChapterDeletionBadge
            scheduledDeleteAt={hasScheduledDeletion}
            onUndo={onRestoreArchived}
            isPending={false}
          />
        ) : isArchived ? (
          <button
            onClick={onRestoreArchived}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Chapter
          </button>
        ) : (
          <button
            onClick={onDelete}
            disabled={isPendingDeletion}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>

      {/* Archived Notice */}
      {isArchived && !hasScheduledDeletion && (
        <div className="mb-6">
          <StatusIndicator
            status="archived"
            message="This chapter is archived and cannot be edited. Click 'Restore' to make it active again."
            size="md"
            showIcon={true}
            className="w-full justify-start p-4 rounded-lg"
          />
        </div>
      )}

      {/* Form */}
      <div
        className={`bg-bg rounded-xl border border-border-primary p-6 space-y-6 ${
          isPendingDeletion || isArchived
            ? "opacity-50 pointer-events-none"
            : ""
        }`}
      >
        {/* Basic Information - ACCORDION */}
        <div className="space-y-4">
          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => setBasicInfoOpen(!basicInfoOpen)}
            className="w-full flex items-center justify-between text-lg font-semibold text-heading border-b border-border-primary pb-2 hover:text-primary transition-colors"
          >
            <span>Basic Information</span>
            {basicInfoOpen ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {/* Accordion Content */}
          {basicInfoOpen && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Chapter Number"
                  required
                  help="You can also drag to reorder"
                >
                  <FormInput
                    type="number"
                    value={formData.chapterNumber}
                    onChange={(e) =>
                      handleFieldChange("chapterNumber", e.target.value)
                    }
                    min="1"
                    placeholder="Chapter number"
                    className="text-lg"
                    disabled={isPendingDeletion || isArchived}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Chapter Title" required>
                    <FormInput
                      value={formData.title}
                      onChange={(e) => handleFieldChange("title", e.target.value)}
                      placeholder="e.g., Introduction"
                      className="text-lg"
                      disabled={isPendingDeletion || isArchived}
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
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder="Describe what students will learn in this chapter..."
                  rows={3}
                  disabled={isPendingDeletion || isArchived}
                />
              </FormField>

              {/* Media - Now inside Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <MediaInput
                  label="Chapter Image"
                  value={formData.imageId}
                  onChange={(imageId) => handleFieldChange("imageId", imageId)}
                  mediaType="image"
                  placeholder="Select or upload chapter image"
                  showPreview={true}
                />

                <MediaInput
                  label="Chapter Video"
                  value={formData.videoId}
                  onChange={(videoId) => handleFieldChange("videoId", videoId)}
                  mediaType="video"
                  placeholder="Select or upload chapter video"
                  showPreview={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Hint with Status */}
        <div className="flex items-center gap-2 text-sm text-text/70 bg-bg2 p-3 rounded-lg">
          <StatusIndicator
            status={
              isPendingDeletion
                ? "pendingDeletion"
                : isArchived
                ? "archived"
                : "unsaved"
            }
            size="xs"
            showLabel={false}
          />
          <span>
            {isPendingDeletion
              ? "This chapter will be deleted when you save all changes."
              : isArchived
              ? "This chapter is archived and cannot be edited."
              : 'Changes will be saved when you click "Save All Changes" in the header.'}
          </span>
        </div>
      </div>
    </div>
  );
}