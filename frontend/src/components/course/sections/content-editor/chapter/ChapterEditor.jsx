// frontend/src/components/course/sections/content-editor/chapter/ChapterEditor.jsx
import { useState, useEffect } from "react";
import { BookOpen, Trash2, RotateCcw } from "lucide-react";
import { FormField, FormInput, FormTextarea } from "../../../../forms";
import MediaInput from "../../../../media/MediaInput";
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
  const hasScheduledDeletion = chapterData.purgeAfterAt || chapterData.scheduledDeleteAt;

  const [formData, setFormData] = useState({
    chapterNumber: "",
    title: "",
    description: "",
    content: "",
    imageId: null,
    videoId: null,
  });

  useEffect(() => {
    setFormData({
      chapterNumber: String(chapterData.chapterNumber || ""),
      title: chapterData.title || "",
      description: chapterData.description || "",
      content: chapterData.content || "",
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
    if (isArchived && hasScheduledDeletion) return "This chapter is scheduled for deletion";
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
              variant={isPendingDeletion || (isArchived && hasScheduledDeletion) ? "danger" : isArchived ? "warning" : "primary"}
              size="sm"
            />
            <div>
              <h2 className={`text-xl font-bold ${getTitleStyle()} flex items-center gap-2`}>
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
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restore
          </button>
        ) : (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>

      {/* Status Messages using StatusIndicator component style */}
      {isPendingDeletion && (
        <div className="mb-6">
          <StatusIndicator 
            status="pendingDeletion"
            label="This chapter is marked for deletion. Click 'Cancel' above to restore it, or save changes to permanently delete it."
            size="md"
            showIcon={true}
            className="w-full justify-start p-4 rounded-lg"
          />
        </div>
      )}

      {isArchived && hasScheduledDeletion && (
        <div className="mb-6">
          <StatusIndicator 
            status="scheduledDeletion"
            label="This chapter is scheduled for permanent deletion. Click 'Undo' to cancel the deletion."
            size="md"
            showIcon={true}
            className="w-full justify-start p-4 rounded-lg"
          />
        </div>
      )}

      {isArchived && !hasScheduledDeletion && (
        <div className="mb-6">
          <StatusIndicator 
            status="archived"
            label="This chapter is archived. Click 'Restore' to make it active again."
            size="md"
            showIcon={true}
            className="w-full justify-start p-4 rounded-lg"
          />
        </div>
      )}

      {/* Form */}
      <div className={`bg-bg rounded-xl border border-border-primary p-6 space-y-6 ${
        isPendingDeletion || isArchived ? "opacity-50 pointer-events-none" : ""
      }`}>
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-heading border-b border-border-primary pb-2">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Chapter Number" required help="You can also drag to reorder">
              <FormInput
                type="number"
                value={formData.chapterNumber}
                onChange={(e) => handleFieldChange("chapterNumber", e.target.value)}
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

          <FormField label="Description" help="Brief description of what this chapter covers">
            <FormTextarea
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Describe what students will learn in this chapter..."
              rows={3}
              disabled={isPendingDeletion || isArchived}
            />
          </FormField>
        </div>

        {/* Chapter Content */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-heading border-b border-border-primary pb-2">
            Chapter Content
          </h3>

          <FormField label="Content" help="Main content of the chapter - you can use markdown formatting">
            <FormTextarea
              value={formData.content}
              onChange={(e) => handleFieldChange("content", e.target.value)}
              placeholder="Enter the chapter content here..."
              rows={12}
              className="font-mono text-sm"
              disabled={isPendingDeletion || isArchived}
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

        {/* Save Hint with Status */}
        <div className="flex items-center gap-2 text-sm text-text/70 bg-bg2 p-3 rounded-lg">
          <StatusIndicator 
            status={isPendingDeletion ? "pendingDeletion" : isArchived ? "archived" : "unsaved"}
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