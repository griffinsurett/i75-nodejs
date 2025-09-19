// frontend/src/components/media/MediaInput.jsx
import { useState, useEffect } from 'react';
import { Image as ImageIcon, Film, Upload, X } from 'lucide-react';
import MediaSelector from './MediaSelector';
import { imageAPI, videoAPI } from '../../services/api';

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

  // Load existing media if value is provided
  useEffect(() => {
    if (value && !selectedMedia) {
      loadMedia(value);
    }
  }, [value]);

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
        <>
          {selectedMedia.imageUrl ? (
            <img
              src={selectedMedia.imageUrl}
              alt={selectedMedia.title || 'Video thumbnail'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-bg2">
              <Film className="w-6 h-6 text-text/40" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 rounded-full p-2">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </>
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
        {selectedMedia && showPreview ? (
          <div className="flex gap-4">
            {/* Preview Thumbnail */}
            <div className="w-32 h-32 rounded-lg overflow-hidden border border-border-primary relative">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-bg2">
                  <div className="animate-pulse">Loading...</div>
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
        ) : (
          /* No Selection - Show Button */
          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
            className="w-full px-4 py-3 border-2 border-dashed border-border-primary rounded-lg hover:border-primary transition-colors flex items-center justify-center gap-2 text-text"
          >
            <Upload className="w-5 h-5" />
            <span>{placeholder}</span>
          </button>
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