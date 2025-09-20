import { useEffect } from 'react';
import Modal from '../../../Modal';
import { X } from 'lucide-react';
import { sectionAPI } from '../../../../services/api';
import { validators } from '../../../../utils/forms/validation';
import {
  Form,
  FormField,
  FormInput,
  FormTextarea,
} from '../../../forms';
import MediaInput from '../../../media/MediaInput';

export default function ChapterFormModal({
  isOpen,
  onClose,
  sectionId,
  chapter,
  onSuccess
}) {
  const isEdit = !!chapter;

  // Define validation
  const validation = {
    chapterNumber: validators.compose(
      validators.required('Chapter number is required'),
      (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) {
          return 'Chapter number must be a positive number';
        }
        return undefined;
      }
    ),
    title: validators.compose(
      validators.required('Chapter title is required'),
      validators.minLength(3, 'Title must be at least 3 characters')
    ),
    description: validators.maxLength(500, 'Description must be less than 500 characters'),
    content: validators.maxLength(5000, 'Content must be less than 5000 characters'),
  };

  // Load initial data
  const loadData = async () => {
    let formData = {
      chapterNumber: '',
      title: '',
      description: '',
      content: '',
      imageId: null,
      videoId: null,
    };

    if (chapter) {
      const chapterData = chapter.chapters || chapter;
      formData = {
        chapterNumber: String(chapterData.chapterNumber || ''),
        title: chapterData.title || '',
        description: chapterData.description || '',
        content: chapterData.content || '',
        imageId: chapterData.imageId || null,
        videoId: chapterData.videoId || null,
      };
    }

    return { formData };
  };

  // Handle submission
  const handleSubmit = async (values) => {
    if (!sectionId) {
      throw new Error('Section ID is missing');
    }

    if (isEdit) {
      const chapterData = chapter.chapters || chapter;
      await sectionAPI.updateSectionChapter(sectionId, chapterData.chapterId, values);
    } else {
      await sectionAPI.createSectionChapter(sectionId, values);
    }
    
    onSuccess();
    onClose();
  };

  // Transform values before submission
  const transformOnSubmit = (values) => ({
    chapterNumber: parseInt(values.chapterNumber),
    title: values.title?.trim(),
    description: values.description?.trim() || undefined,
    content: values.content?.trim() || undefined,
    imageId: values.imageId || undefined,
    videoId: values.videoId || undefined,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-heading">
            {isEdit ? 'Edit Chapter' : 'Add Chapter'}
          </h2>
          <button onClick={onClose} className="text-text hover:text-heading">
            <X className="w-6 h-6" />
          </button>
        </div>

        <Form
          loadData={isOpen ? loadData : null}
          dependencies={[isOpen, chapter]}
          validation={validation}
          transformOnSubmit={transformOnSubmit}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Update Chapter' : 'Create Chapter'}
          onCancel={onClose}
          showLoadingState={false}
        >
          {(form) => (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Chapter Number"
                  name="chapterNumber"
                  required
                  error={form.touched.chapterNumber && form.errors.chapterNumber}
                >
                  <FormInput
                    type="number"
                    {...form.getFieldProps('chapterNumber')}
                    placeholder="e.g., 1"
                    min="1"
                  />
                </FormField>

                <FormField
                  label="Chapter Title"
                  name="title"
                  required
                  error={form.touched.title && form.errors.title}
                >
                  <FormInput
                    {...form.getFieldProps('title')}
                    placeholder="e.g., Introduction"
                  />
                </FormField>
              </div>

              <FormField
                label="Description"
                name="description"
                error={form.touched.description && form.errors.description}
              >
                <FormTextarea
                  {...form.getFieldProps('description')}
                  rows={3}
                  placeholder="Brief description of this chapter"
                />
              </FormField>

              <FormField
                label="Chapter Content"
                name="content"
                error={form.touched.content && form.errors.content}
                help="Main content of the chapter"
              >
                <FormTextarea
                  {...form.getFieldProps('content')}
                  rows={8}
                  placeholder="Enter the chapter content..."
                  className="font-mono text-sm"
                />
              </FormField>

              <MediaInput
                label="Chapter Image"
                value={form.values.imageId}
                onChange={(imageId) => form.setFieldValue('imageId', imageId)}
                mediaType="image"
                placeholder="Select or upload chapter image"
                showPreview={true}
              />

              <MediaInput
                label="Chapter Video"
                value={form.values.videoId}
                onChange={(videoId) => form.setFieldValue('videoId', videoId)}
                mediaType="video"
                placeholder="Select or upload chapter video"
                showPreview={true}
              />
            </>
          )}
        </Form>
      </div>
    </Modal>
  );
}