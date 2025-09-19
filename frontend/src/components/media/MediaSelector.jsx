// frontend/src/components/media/MediaSelector.jsx
import { useState, useEffect } from 'react';
import { X, Upload, Grid3x3 } from 'lucide-react';
import Modal from '../Modal';
import MediaLibraryContent from './MediaLibraryContent';
import MediaUploader from './MediaUploader';

export default function MediaSelector({
  isOpen,
  onClose,
  onSelect,
  mediaType = 'all',
  title = 'Select Media',
  allowMultiple = false,
  currentSelection = null,
}) {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize selection from current
  useEffect(() => {
    if (currentSelection) {
      if (Array.isArray(currentSelection)) {
        setSelectedItems(new Set(currentSelection));
      } else if (currentSelection) {
        setSelectedItems(new Set([currentSelection]));
      }
    } else {
      setSelectedItems(new Set());
    }
  }, [currentSelection]);

  const handleSelectionChange = (newSelection) => {
    setSelectedItems(newSelection);
  };

  const handleSelectConfirm = async () => {
    if (selectedItems.size === 0) return;

    const selectedIds = Array.from(selectedItems);
    
    if (allowMultiple) {
      onSelect(selectedIds);
    } else {
      onSelect(selectedIds[0]);
    }
    
    onClose();
  };

  const handleUploaderComplete = (uploadedMedia) => {
    // Refresh the media library
    setRefreshTrigger(prev => prev + 1);
    
    // If we have uploaded media info and it's single selection mode
    if (uploadedMedia && !allowMultiple) {
      // Auto-select the uploaded media
      const mediaId = uploadedMedia.imageId || uploadedMedia.videoId;
      if (mediaId) {
        onSelect(mediaId);
        onClose();
        return; // Exit early - don't switch tabs
      }
    }
    
    // Switch back to library tab
    setActiveTab('library');
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Determine selection mode based on allowMultiple
  const selectionMode = true; // Always use selection mode in the modal

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-6xl w-full max-h-[90vh] bg-bg p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between">
        <h2 className="text-xl font-bold text-heading">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-bg2 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-border-primary flex gap-4">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'library'
              ? 'bg-primary text-white'
              : 'bg-bg2 text-text hover:bg-bg3'
          }`}
        >
          <Grid3x3 className="w-4 h-4 inline-block mr-2" />
          Media Library
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-primary text-white'
              : 'bg-bg2 text-text hover:bg-bg3'
          }`}
        >
          <Upload className="w-4 h-4 inline-block mr-2" />
          Upload New
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
        {activeTab === 'library' ? (
          <MediaLibraryContent
            onSelectionChange={handleSelectionChange}
            selectionMode={selectionMode}
            selectedItems={selectedItems}
            mediaTypeFilter={mediaType}
            showArchived={false}
            compact={true}
            onRefresh={handleRefresh}
            key={refreshTrigger} // Force refresh when this changes
          />
        ) : (
          <MediaUploader 
            onComplete={handleUploaderComplete}
            mediaType={mediaType}
            singleUploadMode={!allowMultiple}
          />
        )}
      </div>

      {/* Footer */}
      {activeTab === 'library' && (
        <div className="px-6 py-4 border-t border-border-primary flex items-center justify-between">
          <div className="text-sm text-text">
            {selectedItems.size > 0 && (
              <span>
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border-primary rounded-lg hover:bg-bg2"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectConfirm}
              disabled={selectedItems.size === 0}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {allowMultiple 
                ? `Select ${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''}`
                : 'Select'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}