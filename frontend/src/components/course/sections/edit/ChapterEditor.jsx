// frontend/src/components/course/sections/edit/ChapterEditor.jsx
import { useState, useEffect } from 'react';
import { BookOpen, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { FormField, FormInput, FormTextarea } from '../../../forms';
import MediaInput from '../../../media/MediaInput';
import ChapterDeletionBadge from './ChapterDeletionBadge';

export default function ChapterEditor({ 
  sectionId, 
  chapter, 
  chapters,
  onUpdate, 
  onDelete,
  onUndoDelete,
  onRestoreArchived,
  isTemp = false
}) {
  const chapterData = chapter.chapters || chapter;
  const isPendingDeletion = chapter.pendingDeletion;
  const isArchived = chapterData.isArchived;
  const hasScheduledDeletion = chapterData.purgeAfterAt || chapterData.scheduledDeleteAt;
  
  const [formData, setFormData] = useState({
    chapterNumber: '',
    title: '',
    description: '',
    content: '',
    imageId: null,
    videoId: null,
  });

  // Initialize form data when chapter changes
  useEffect(() => {
    setFormData({
      chapterNumber: String(chapterData.chapterNumber || ''),
      title: chapterData.title || '',
      description: chapterData.description || '',
      content: chapterData.content || '',
      imageId: chapterData.imageId || null,
      videoId: chapterData.videoId || null,
    });
  }, [chapter]);

  const handleFieldChange = (field, value) => {
    // Don't allow edits if marked for deletion or archived
    if (isPendingDeletion || isArchived) return;
    
    // Allow chapter number changes now
    if (field === 'chapterNumber') {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue > 0) {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Immediately update parent with the number change
        onUpdate({ chapterNumber: numValue });
      } else if (value === '') {
        // Allow clearing the field for typing
        setFormData(prev => ({ ...prev, [field]: value }));
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Immediately update parent with changes
    onUpdate({ [field]: value });
  };

  const handleKeyDown = (e) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      // The parent component will handle the actual save
    }
  };

  const getHeaderColor = () => {
    if (isPendingDeletion || (isArchived && hasScheduledDeletion)) {
      return 'bg-red-100 dark:bg-red-900/20';
    }
    if (isArchived) {
      return 'bg-yellow-100 dark:bg-yellow-900/20';
    }
    return 'bg-primary/10';
  };

  const getIconColor = () => {
    if (isPendingDeletion || (isArchived && hasScheduledDeletion)) {
      return 'text-red-600';
    }
    if (isArchived) {
      return 'text-yellow-600';
    }
    return 'text-primary';
  };

  const getTitleStyle = () => {
    if (isPendingDeletion || (isArchived && hasScheduledDeletion)) {
      return 'text-red-600 line-through';
    }
    if (isArchived) {
      return 'text-yellow-600';
    }
    return 'text-heading';
  };

  return (
    <div className="max-w-4xl mx-auto" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getHeaderColor()}`}>
            <BookOpen className={`w-5 h-5 ${getIconColor()}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${getTitleStyle()}`}>
              Chapter {formData.chapterNumber || chapterData.chapterNumber}: {formData.title || 'Untitled'}
              {isTemp && !isPendingDeletion && !isArchived && (
                <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                  Unsaved
                </span>
              )}
            </h2>
            <p className="text-sm text-text/70">
              {isPendingDeletion 
                ? 'This chapter will be deleted when you save'
                : isArchived && hasScheduledDeletion
                  ? 'This chapter is scheduled for deletion'
                  : isArchived
                    ? 'This chapter is archived'
                    : 'Edit chapter content and settings'
              }
            </p>
          </div>
        </div>

        {/* Deletion Badge or Actions */}
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

      {/* Warning Messages */}
      {isPendingDeletion && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            This chapter is marked for deletion. Click "Cancel" above to restore it, or save changes to permanently delete it.
          </p>
        </div>
      )}

      {isArchived && hasScheduledDeletion && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-sm text-orange-600 dark:text-orange-400">
            This chapter is scheduled for permanent deletion. Click "Undo" to cancel the deletion.
          </p>
        </div>
      )}

      {isArchived && !hasScheduledDeletion && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            This chapter is archived. Click "Restore" to make it active again.
          </p>
        </div>
      )}

      {/* Form - Disable all fields if pending deletion or archived */}
      <div className={`bg-bg rounded-xl border border-border-primary p-6 space-y-6 ${(isPendingDeletion || isArchived) ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Rest of the form remains the same */}
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-heading border-b border-border-primary pb-2">
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Chapter Number"
              required
              help="You can also drag to reorder"
            >
              <FormInput
                type="number"
                value={formData.chapterNumber}
                onChange={(e) => handleFieldChange('chapterNumber', e.target.value)}
                min="1"
                placeholder="Chapter number"
                className="text-lg"
                disabled={isPendingDeletion || isArchived}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                label="Chapter Title"
                required
              >
                <FormInput
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
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
              onChange={(e) => handleFieldChange('description', e.target.value)}
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
          
          <FormField
            label="Content"
            help="Main content of the chapter - you can use markdown formatting"
          >
            <FormTextarea
              value={formData.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
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
              onChange={(imageId) => handleFieldChange('imageId', imageId)}
              mediaType="image"
              placeholder="Select or upload chapter image"
              showPreview={true}
            />

            <MediaInput
              label="Chapter Video"
              value={formData.videoId}
              onChange={(videoId) => handleFieldChange('videoId', videoId)}
              mediaType="video"
              placeholder="Select or upload chapter video"
              showPreview={true}
            />
          </div>
        </div>

        {/* Save Hint */}
        <div className="flex items-center gap-2 text-sm text-text/70 bg-bg2 p-3 rounded-lg">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span>
            {isPendingDeletion 
              ? 'This chapter will be deleted when you save all changes.'
              : isArchived
                ? 'This chapter is archived and cannot be edited.'
                : 'Changes will be saved when you click "Save All Changes" in the header.'
            }
          </span>
        </div>
      </div>
    </div>
  );
}