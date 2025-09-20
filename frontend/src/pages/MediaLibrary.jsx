// frontend/src/pages/MediaLibrary.jsx
import { useState, useEffect } from "react";
import { Plus, CheckSquare } from "lucide-react";
import MediaLibraryContent from "../components/media/MediaLibraryContent";
import ActiveArchivedTabs from "../components/archive/ActiveArchivedTabs";
import ConfirmModal from "../components/ConfirmModal";
import BulkActionsBar from "../components/selection/BulkActionsBar";
import useArchiveList from "../hooks/useArchiveList";
import useBulkOperations from "../hooks/useBulkOperations";
import { imageAPI, videoAPI } from "../services/api";

const MediaLibrary = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  // Remove filteredMedia state - not needed
  const [totalMediaCount, setTotalMediaCount] = useState(0); // Add this for bulk actions count
  
  const bulkOps = useBulkOperations();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);

  // Use the unified archive hook with proper data transformation
  const {
    view,
    setView,
    data: mediaData,
    loading,
    error,
    isArchived,
    refresh
  } = useArchiveList(
    [imageAPI.getAllImages, videoAPI.getAllVideos],
    {
      defaultError: 'Failed to load media library',
      combineResults: (results) => {
        const [images, videosRaw] = results;
        
        // Transform video data to include thumbnail images
        const videos = (videosRaw || []).map((item) => {
          if (item.videos) {
            return {
              ...item.videos,
              imageUrl: item.images?.imageUrl,
              imageAlt: item.images?.altText,
            };
          }
          return item;
        });
        
        // Return the properly structured data
        return {
          images: images || [],
          videos: videos || []
        };
      }
    }
  );

  // Extract images and videos from the combined data
  const images = mediaData?.images || [];
  const videos = mediaData?.videos || [];

  // Calculate total count for "Select All"
  const allMedia = [
    ...images.map((img) => ({ ...img, type: "image", url: img.imageUrl })),
    ...videos.map((vid) => ({ ...vid, type: "video", url: vid.slidesUrl })),
  ];

  // Clear selections when view changes
  useEffect(() => {
    setSelectedItems(new Set());
  }, [view]);

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedItems(new Set());
    }
  };

  const handleSelectAll = () => {
    const allIds = allMedia.map(item => item.imageId || item.videoId);
    setSelectedItems(new Set(allIds));
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    await bulkOps.executeBulkOperation(
      selectedItems,
      async (itemId) => {
        const item = allMedia.find(
          (m) => (m.imageId || m.videoId) === itemId
        );
        if (!item) return;

        if (item.type === "video") {
          return videoAPI.deleteVideo(itemId);
        } else {
          return imageAPI.deleteImage(itemId);
        }
      },
      () => {
        handleClearSelection();
        setBulkDeleteOpen(false);
        refresh();
      }
    );
  };

  const handleBulkArchive = async () => {
    await bulkOps.executeBulkOperation(
      selectedItems,
      async (itemId) => {
        const item = allMedia.find(
          (m) => (m.imageId || m.videoId) === itemId
        );
        if (!item) return;

        const api = item.type === "video" ? videoAPI : imageAPI;
        
        if (isArchived) {
          return item.type === "video"
            ? api.restoreVideo(itemId)
            : api.restoreImage(itemId);
        } else {
          return item.type === "video"
            ? api.archiveVideo(itemId)
            : api.archiveImage(itemId);
        }
      },
      () => {
        handleClearSelection();
        setBulkArchiveOpen(false);
        refresh();
      }
    );
  };

  // Update total count when media changes
  useEffect(() => {
    setTotalMediaCount(allMedia.length);
  }, [images.length, videos.length]); // Only depend on array lengths

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-heading">
            {showUploader 
              ? "Add New Media" 
              : isArchived 
              ? "Archived Media" 
              : "Media Library"}
          </h1>

          <div className="flex items-center gap-3">
            {!showUploader && (
              <>
                <ActiveArchivedTabs value={view} onChange={setView} />

                <button
                  onClick={toggleSelectionMode}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectionMode
                      ? "bg-primary text-white"
                      : "bg-bg2 text-text hover:bg-bg3"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectionMode ? "Cancel" : "Select"}
                </button>
              </>
            )}

            <button
              onClick={() => setShowUploader(!showUploader)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showUploader
                  ? "bg-bg2 text-text hover:bg-bg3"
                  : "bg-primary hover:bg-primary/80 text-white"
              }`}
            >
              {showUploader ? (
                "Media Library"
              ) : (
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
      {!showUploader && selectionMode && selectedItems.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedItems.size}
          totalCount={totalMediaCount}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onArchive={() => setBulkArchiveOpen(true)}
          onDelete={() => setBulkDeleteOpen(true)}
          archiveLabel={isArchived ? "Restore" : "Archive"}
        />
      )}

      {/* Content - Remove onMediaDataChange prop */}
      <MediaLibraryContent
        onSelectionChange={setSelectedItems}
        selectionMode={selectionMode}
        allowMultiple={true}
        selectedItems={selectedItems}
        mediaTypeFilter="all"
        showArchived={isArchived}
        showUploader={showUploader}
        onUploaderComplete={() => {
          setShowUploader(false);
          refresh();
        }}
        // Remove onMediaDataChange prop - not needed!
        compact={false}
        initialImages={images}
        initialVideos={videos}
        loading={loading}
        error={error}
        onRefresh={refresh}
      />

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
        title={
          isArchived
            ? `Restore ${selectedItems.size} items?`
            : `Archive ${selectedItems.size} items?`
        }
        description={
          isArchived
            ? "This will restore the selected items and make them active again."
            : "This will archive the selected items. You can restore them later from the archived view."
        }
        confirmLabel={isArchived ? "Restore All" : "Archive All"}
        onConfirm={handleBulkArchive}
        busy={bulkOps.loading}
        error={bulkOps.error}
      />
    </div>
  );
};

export default MediaLibrary;