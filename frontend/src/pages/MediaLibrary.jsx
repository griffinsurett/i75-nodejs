import { useState, useEffect, useCallback } from 'react';
import { imageAPI, videoAPI } from '../services/api';
import { 
  Loader2, 
  AlertCircle, 
  Image as ImageIcon, 
  Plus,
  CheckSquare
} from 'lucide-react';
import MediaControls from '../components/media/MediaControls';
import MediaCard from '../components/media/MediaCard';
import MediaListItem from '../components/media/MediaListItem';
import MediaPreviewModal from '../components/media/MediaPreviewModal';
import MediaUploader from '../components/media/MediaUploader';
import ActiveArchivedTabs from '../components/archive/ActiveArchivedTabs';
import ArchivedNotice from '../components/archive/ArchivedNotice';
import ConfirmModal from '../components/ConfirmModal';
import BulkActionsBar from '../components/selection/BulkActionsBar';
import useArchiveViewParam from '../hooks/useArchiveViewParam';
import useSelectionMode from '../hooks/useSelectionMode';
import useBulkOperations from '../hooks/useBulkOperations';

const MediaLibrary = () => {
  const [view, setView] = useArchiveViewParam();
  const [activeTab, setActiveTab] = useState('all');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  
  // Use the selection hook
  const {
    selectedItems,
    selectionMode,
    toggleItemSelection,
    selectAll,
    clearSelection,
    isSelected,
    toggleSelectionMode
  } = useSelectionMode();
  
  // Use the bulk operations hook
  const bulkOps = useBulkOperations();
  
  // Bulk action modals
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = view === 'archived' ? { archived: 'true' } : {};
      
      const [imagesRes, videosRes] = await Promise.all([
        imageAPI.getAllImages(params),
        videoAPI.getAllVideos(params)
      ]);

      if (imagesRes.data?.success) {
        setImages(imagesRes.data.data || []);
      }
      if (videosRes.data?.success) {
        const videoData = videosRes.data.data.map(item => {
          if (item.videos) {
            return {
              ...item.videos,
              thumbnailUrl: item.images?.imageUrl,
              thumbnailAlt: item.images?.altText
            };
          }
          return item;
        });
        setVideos(videoData);
      }
    } catch (err) {
      setError('Failed to load media library');
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    if (!showUploader) {
      fetchMedia();
    }
  }, [fetchMedia, showUploader]);

  // Clear selection when view changes
  useEffect(() => {
    clearSelection();
  }, [view, activeTab]);

  const getFilteredMedia = () => {
    let media = [];
    
    if (activeTab === 'all') {
      media = [
        ...images.map(img => ({ ...img, type: 'image', url: img.imageUrl })),
        ...videos.map(vid => ({ ...vid, type: 'video', url: vid.slidesUrl }))
      ];
    } else if (activeTab === 'images') {
      media = images.map(img => ({ ...img, type: 'image', url: img.imageUrl }));
    } else {
      media = videos.map(vid => ({ ...vid, type: 'video', url: vid.slidesUrl }));
    }

    if (searchQuery) {
      media = media.filter(item => {
        const searchFields = [
          item.altText,
          item.title,
          item.description,
          item.url
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchFields.includes(searchQuery.toLowerCase());
      });
    }

    return media.sort((a, b) => 
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  };

  const filteredMedia = getFilteredMedia();

  // Bulk action handlers
  const handleBulkDelete = async () => {
    await bulkOps.executeBulkOperation(
      selectedItems,
      async (itemId) => {
        const item = filteredMedia.find(m => (m.imageId || m.videoId) === itemId);
        if (item?.type === 'video') {
          return videoAPI.deleteVideo(itemId);
        } else {
          return imageAPI.deleteImage(itemId);
        }
      },
      () => {
        clearSelection();
        fetchMedia();
        setBulkDeleteOpen(false);
      }
    );
  };

  const handleBulkArchive = async () => {
    const isArchivedView = view === 'archived';
    await bulkOps.executeBulkOperation(
      selectedItems,
      async (itemId) => {
        const item = filteredMedia.find(m => (m.imageId || m.videoId) === itemId);
        if (!item) return;
        
        const api = item.type === 'video' ? videoAPI : imageAPI;
        if (isArchivedView) {
          return item.type === 'video' 
            ? api.restoreVideo(itemId)
            : api.restoreImage(itemId);
        } else {
          return item.type === 'video'
            ? api.archiveVideo(itemId)
            : api.archiveImage(itemId);
        }
      },
      () => {
        clearSelection();
        fetchMedia();
        setBulkArchiveOpen(false);
      }
    );
  };

  const isArchivedView = view === 'archived';

  if (loading && !showUploader) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text/70">Loading media library...</span>
      </div>
    );
  }

  if (error && !showUploader) {
    return (
      <div className="flex items-center justify-center min-h-64 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-heading">
            {showUploader ? 'Add New Media' : isArchivedView ? 'Archived Media' : 'Media Library'}
          </h1>
          
          <div className="flex items-center gap-3">
            {!showUploader && (
              <>
                <ActiveArchivedTabs 
                  value={view} 
                  onChange={setView}
                />
                
                <button
                  onClick={toggleSelectionMode}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectionMode 
                      ? 'bg-primary text-white' 
                      : 'bg-bg2 text-text hover:bg-bg3'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectionMode ? 'Cancel' : 'Select'}
                </button>
              </>
            )}
            
            <button
              onClick={() => setShowUploader(!showUploader)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showUploader 
                  ? 'bg-bg2 text-text hover:bg-bg3' 
                  : 'bg-primary hover:bg-primary/80 text-white'
              }`}
            >
              {showUploader ? 'Media Library' : (
                <>
                  <Plus className="w-4 h-4" />
                  Add New
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {!showUploader && (
        <BulkActionsBar
          selectedCount={selectedItems.size}
          totalCount={filteredMedia.length}
          onSelectAll={() => selectAll(filteredMedia.map(item => item.imageId || item.videoId))}
          onClearSelection={clearSelection}
          onArchive={() => setBulkArchiveOpen(true)}
          onDelete={() => setBulkDeleteOpen(true)}
          archiveLabel={isArchivedView ? 'Restore' : 'Archive'}
        />
      )}

      {/* Content */}
      {showUploader ? (
        <MediaUploader onComplete={() => {
          setShowUploader(false);
          fetchMedia();
        }} />
      ) : (
        <>
          {isArchivedView && <ArchivedNotice />}

          <MediaControls
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            viewMode={viewMode}
            setViewMode={setViewMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            imageCount={images.length}
            videoCount={videos.length}
          />

          {/* Media Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMedia.map((item) => (
                <MediaCard
                  key={item.imageId || item.videoId}
                  item={item}
                  onClick={() => !selectionMode && setSelectedItem(item)}
                  onChanged={fetchMedia}
                  selectionMode={selectionMode}
                  isSelected={isSelected(item.imageId || item.videoId)}
                  onToggleSelect={() => toggleItemSelection(item.imageId || item.videoId)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-bg rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg2 border-b border-border-primary">
                  <tr>
                    {selectionMode && (
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === filteredMedia.length && filteredMedia.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAll(filteredMedia.map(item => item.imageId || item.videoId));
                            } else {
                              clearSelection();
                            }
                          }}
                          className="rounded border-border-primary"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Preview</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Format</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {filteredMedia.map((item) => (
                    <MediaListItem
                      key={item.imageId || item.videoId}
                      item={item}
                      onClick={() => !selectionMode && setSelectedItem(item)}
                      onChanged={fetchMedia}
                      selectionMode={selectionMode}
                      isSelected={isSelected(item.imageId || item.videoId)}
                      onToggleSelect={() => toggleItemSelection(item.imageId || item.videoId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedItem && (
        <MediaPreviewModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Bulk Modals */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${selectedItems.size} items?`}
        description="This will permanently delete the selected items. This action cannot be undone."
        confirmLabel="Delete All"
        confirmClass="bg-red-600"
        onConfirm={handleBulkDelete}
        busy={bulkOps.loading}
        error={bulkOps.error}
      />

      <ConfirmModal
        isOpen={bulkArchiveOpen}
        onClose={() => setBulkArchiveOpen(false)}
        title={isArchivedView ? `Restore ${selectedItems.size} items?` : `Archive ${selectedItems.size} items?`}
        description={
          isArchivedView
            ? "This will restore the selected items and make them active again."
            : "This will archive the selected items. You can restore them later from the archived view."
        }
        confirmLabel={isArchivedView ? "Restore All" : "Archive All"}
        onConfirm={handleBulkArchive}
        busy={bulkOps.loading}
        error={bulkOps.error}
      />
    </div>
  );
};

export default MediaLibrary;