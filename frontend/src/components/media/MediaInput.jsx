// frontend/src/components/media/MediaInput.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ImageIcon, Film, Upload, X, Loader2 } from 'lucide-react';
import MediaSelector from './MediaSelector';
import { VideoThumbnail } from '../VideoThumbnail';
import { imageAPI, videoAPI, uploadAPI } from '../../services/api';

export default function MediaInput({
  label,
  value, // Media ID or array of IDs for multiple
  onChange, // Callback with media ID(s)
  mediaType = 'all', // 'all' | 'image' | 'video'
  placeholder = 'Select media',
  required = false,
  error,
  className = '',
  allowClear = true,
  allowMultiple = false,
  showPreview = true,
}) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;

    const droppedFiles = [...e.dataTransfer.files];
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles[0]); // Only take first file for single upload
    }
  }, [mediaType]);

  // Load existing media if value is provided
  useEffect(() => {
    if (value && !selectedMedia && !uploading) {
      loadMedia(value);
    }
  }, [value, selectedMedia, uploading]);

  const loadMedia = async (mediaId) => {
    if (!mediaId) return;
    
    // Handle multiple IDs
    if (Array.isArray(mediaId)) {
      // For now, just load the first one for preview
      mediaId = mediaId[0];
    }
    
    setLoading(true);
    try {
      // Try as image first
      try {
        const response = await imageAPI.getImage(mediaId);
        if (response.data?.success) {
          const imageData = response.data.data;
          setSelectedMedia({
            ...imageData,
            type: 'image',
            url: imageData.imageUrl,
          });
          return;
        }
      } catch (e) {
        // Not an image, try video
      }

      // Try as video
      try {
        const response = await videoAPI.getVideo(mediaId);
        if (response.data?.success) {
          const videoData = response.data.data;
          setSelectedMedia({
            ...videoData.videos || videoData,
            type: 'video',
            url: videoData.videos?.slidesUrl || videoData.slidesUrl,
            imageUrl: videoData.images?.imageUrl,
          });
        }
      } catch (e) {
        console.error('Failed to load media:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      console.error('Invalid file type');
      return;
    }

    // Check media type filter
    if (mediaType === 'image' && !isImage) {
      console.error('Only images are allowed');
      return;
    }
    if (mediaType === 'video' && !isVideo) {
      console.error('Only videos are allowed');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const onUploadProgress = (progress) => {
        setUploadProgress(progress);
      };

      let response;
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension for default title

      if (isImage) {
        response = await uploadAPI.uploadImage(file, fileName, onUploadProgress);
      } else {
        response = await uploadAPI.uploadVideo(file, fileName, '', onUploadProgress);
      }

      if (response.data?.success) {
        const uploadedId = response.data.data.imageId || response.data.data.videoId;
        onChange(uploadedId);
        // loadMedia will be called by useEffect when value changes
      }
    } catch (err) {
      console.error('Upload failed:', err);
      // You might want to show an error message to the user here
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSelect = async (mediaId) => {
    // Load the full media data
    await loadMedia(mediaId);
    onChange(mediaId);
  };

  const handleClear = () => {
    setSelectedMedia(null);
    onChange(null);
  };

  const getPreviewComponent = () => {
    if (!selectedMedia) return null;
    
    const isVideo = selectedMedia.type === 'video';
    
    if (isVideo) {
      return (
        <div className="relative w-full h-full">
          <VideoThumbnail
            src={selectedMedia.url}
            thumbnailSrc={selectedMedia.imageUrl}
            alt={selectedMedia.title || 'Video thumbnail'}
            showPlayButton={true}
            className="w-full h-full"
          />
        </div>
      );
    }

    return selectedMedia.url ? (
      <img
        src={selectedMedia.url}
        alt={selectedMedia.altText || 'Selected image'}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-bg2">
        <ImageIcon className="w-6 h-6 text-text/40" />
      </div>
    );
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="space-y-3">
        {/* Preview and Actions */}
        {selectedMedia && showPreview && !uploading ? (
          <div className="flex gap-4">
            {/* Preview Thumbnail */}
            <div className="w-32 h-32 rounded-lg overflow-hidden border border-border-primary relative bg-bg2">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-pulse text-text/60">Loading...</div>
                </div>
              ) : (
                getPreviewComponent()
              )}
            </div>

            {/* Media Info */}
            <div className="flex-1">
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-heading">
                    {selectedMedia.type === 'video' 
                      ? selectedMedia.title 
                      : selectedMedia.altText || 'Untitled'}
                  </p>
                  <p className="text-xs text-text/60">
                    {selectedMedia.type === 'video' ? 'Video' : 'Image'}
                    {selectedMedia.mimeType && ` • ${selectedMedia.mimeType.split('/')[1].toUpperCase()}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectorOpen(true)}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Change
                  </button>
                  {allowClear && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-3 py-1.5 text-sm border border-border-primary rounded-md hover:bg-bg2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : uploading ? (
          /* Upload Progress */
          <div className="p-4 border border-border-primary rounded-lg bg-bg2">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-text">Uploading...</span>
              <span className="text-sm font-medium text-text">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          /* No Selection - Show Drag & Drop Area */
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg transition-colors ${
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-border-primary hover:border-primary'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 text-text"
            >
              <Upload className="w-5 h-5" />
              <span>
                {dragging 
                  ? 'Drop to upload' 
                  : `${placeholder} or drop files here`
                }
              </span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleSelect}
        mediaType={mediaType}
        title={`Select ${mediaType === 'video' ? 'Video' : mediaType === 'image' ? 'Image' : 'Media'}`}
        currentSelection={value}
        allowMultiple={allowMultiple}
      />
    </div>
  );
}