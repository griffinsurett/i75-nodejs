// frontend/src/components/course/sections/edit/ChapterEditor.jsx
import { useState, useEffect } from 'react';
import { BookOpen, Trash2, AlertCircle } from 'lucide-react';
import { FormField, FormInput, FormTextarea } from '../../../forms';
import MediaInput from '../../../media/MediaInput';
import { getNextAvailableChapterNumber } from '../../../../utils/chapterUtils';

export default function ChapterEditor({ 
  sectionId, 
  chapter, 
  chapters,
  onUpdate, 
  onDelete,
  isTemp = false
}) {
  const chapterData = chapter.chapters || chapter;
  
  const [formData, setFormData] = useState({
    chapterNumber: '',
    title: '',
    description: '',
    content: '',
    imageId: null,
    videoId: null,
  });
  
  const [numberWarning, setNumberWarning] = useState('');

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
    setNumberWarning('');
  }, [chapter]);

  const handleFieldChange = (field, value) => {
    let finalValue = value;
    
    // Check for duplicate chapter numbers
    if (field === 'chapterNumber') {
      const newNumber = parseInt(value);
      if (!isNaN(newNumber) && newNumber > 0) {
        // Check if this number is already taken
        const isDuplicate = chapters?.some(ch => {
          const chData = ch.chapters || ch;
          return chData.chapterId !== chapterData.chapterId && 
                 parseInt(chData.chapterNumber) === newNumber;
        });

        if (isDuplicate) {
          const nextAvailable = getNextAvailableChapterNumber(
            chapters, 
            newNumber, 
            chapterData.chapterId
          );
          setNumberWarning(
            `Chapter ${newNumber} already exists. Will be changed to ${nextAvailable} when saved.`
          );
        } else {
          setNumberWarning('');
        }
      }
    }

    setFormData(prev => ({ ...prev, [field]: finalValue }));
    
    // Immediately update parent with changes
    onUpdate({ [field]: finalValue });
  };

  const handleKeyDown = (e) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      // The parent component will handle the actual save
    }
  };

  return (
    <div className="max-w-4xl mx-auto" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-heading">
              Chapter {formData.chapterNumber || chapterData.chapterNumber}: {formData.title || 'Untitled'}
              {isTemp && (
                <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                  Unsaved
                </span>
              )}
            </h2>
            <p className="text-sm text-text/70">Edit chapter content and settings</p>
          </div>
        </div>

        <button
          onClick={onDelete}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      {/* Number Warning */}
      {numberWarning && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {numberWarning}
        </div>
      )}

      {/* Form */}
      <div className="bg-bg rounded-xl border border-border-primary p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-heading border-b border-border-primary pb-2">
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Chapter Number"
              required
              help={numberWarning ? "Number will be auto-adjusted" : undefined}
            >
              <FormInput
                type="number"
                value={formData.chapterNumber}
                onChange={(e) => handleFieldChange('chapterNumber', e.target.value)}
                placeholder="1"
                min="1"
                className={numberWarning ? 'border-yellow-500' : ''}
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
          <span>Changes will be saved when you click "Save All Changes" in the header.</span>
        </div>
      </div>
    </div>
  );
}