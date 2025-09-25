// frontend/src/pages/MediaLibrary.jsx
import { useState, useEffect } from "react";
import { Plus, CheckSquare } from "lucide-react";
import MediaLibraryContent from "../components/media/library/MediaLibraryContent";
import ActiveArchivedTabs from "../components/archive/ActiveArchivedTabs";
import ConfirmModal from "../components/ConfirmModal";
import useArchiveList from "../components/archive/hooks/useArchiveList";
import useBulkOperations from "../hooks/useBulkOperations";
import { imageAPI, videoAPI } from "../services/api";

const MediaLibrary = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [totalMediaCount, setTotalMediaCount] = useState(0);

  const bulkOps = useBulkOperations();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);
  const [bulkOperationError, setBulkOperationError] = useState("");

  // Use the unified archive hook with proper data transformation
  const {
    view,
    setView,
    data: mediaData,
    loading,
    error,
    isArchived,
    refresh,
  } = useArchiveList([imageAPI.getAllImages, videoAPI.getAllVideos], {
    defaultError: "Failed to load media library",
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
        videos: videos || [],
      };
    },
  });

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
    setSelectionMode(false); // Also turn off selection mode when switching views
  }, [view]);

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedItems(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    try {
      setBulkOperationError(""); // Clear any previous errors

      const failedItems = [];
      const selectedArray = Array.from(selectedItems);

      // Process each item
      for (const itemId of selectedArray) {
        try {
          const item = allMedia.find(
            (m) => (m.imageId || m.videoId) === itemId
          );
          if (!item) continue;

          if (item.type === "video") {
            await videoAPI.deleteVideo(itemId);
          } else {
            await imageAPI.deleteImage(itemId);
          }
        } catch (error) {
          console.error(`Failed to delete item ${itemId}:`, error);
          failedItems.push(itemId);
        }
      }

      // Check if all operations succeeded
      if (failedItems.length === 0) {
        // All successful - close modal and reset
        handleClearSelection();
        setBulkDeleteOpen(false);
        setSelectionMode(false);
        refresh();
      } else if (failedItems.length === selectedArray.length) {
        // All failed
        setBulkOperationError(
          "Failed to delete all selected items. Please try again."
        );
      } else {
        // Partial success
        setBulkOperationError(
          `Failed to delete ${failedItems.length} of ${selectedArray.length} items. Please try again.`
        );
        // Remove successfully deleted items from selection
        const newSelection = new Set(failedItems);
        setSelectedItems(newSelection);
        refresh(); // Still refresh to update the successfully deleted ones
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      setBulkOperationError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete items"
      );
    }
  };

  const handleBulkArchive = async () => {
    try {
      setBulkOperationError(""); // Clear any previous errors

      const failedItems = [];
      const selectedArray = Array.from(selectedItems);

      // Process each item
      for (const itemId of selectedArray) {
        try {
          const item = allMedia.find(
            (m) => (m.imageId || m.videoId) === itemId
          );
          if (!item) continue;

          const api = item.type === "video" ? videoAPI : imageAPI;

          if (isArchived) {
            if (item.type === "video") {
              await api.restoreVideo(itemId);
            } else {
              await api.restoreImage(itemId);
            }
          } else {
            if (item.type === "video") {
              await api.archiveVideo(itemId);
            } else {
              await api.archiveImage(itemId);
            }
          }
        } catch (error) {
          console.error(
            `Failed to ${isArchived ? "restore" : "archive"} item ${itemId}:`,
            error
          );
          failedItems.push(itemId);
        }
      }

      // Check if all operations succeeded
      if (failedItems.length === 0) {
        // All successful - close modal and reset
        handleClearSelection();
        setBulkArchiveOpen(false);
        setSelectionMode(false);
        refresh();
      } else if (failedItems.length === selectedArray.length) {
        // All failed
        setBulkOperationError(
          `Failed to ${
            isArchived ? "restore" : "archive"
          } all selected items. Please try again.`
        );
      } else {
        // Partial success
        setBulkOperationError(
          `Failed to ${isArchived ? "restore" : "archive"} ${
            failedItems.length
          } of ${selectedArray.length} items. Please try again.`
        );
        // Remove successfully processed items from selection
        const newSelection = new Set(failedItems);
        setSelectedItems(newSelection);
        refresh(); // Still refresh to update the successfully processed ones
      }
    } catch (error) {
      console.error("Bulk archive/restore error:", error);
      setBulkOperationError(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isArchived ? "restore" : "archive"} items`
      );
    }
  };

  // Update total count when media changes
  useEffect(() => {
    setTotalMediaCount(allMedia.length);
  }, [images.length, videos.length]); // Only depend on array lengths

  // Turn off selection mode when switching to uploader
  useEffect(() => {
    if (showUploader && selectionMode) {
      setSelectionMode(false);
      setSelectedItems(new Set());
    }
  }, [showUploader]);

  // Clear errors when closing modals
  const handleCloseDeleteModal = () => {
    setBulkDeleteOpen(false);
    setBulkOperationError("");
  };

  const handleCloseArchiveModal = () => {
    setBulkArchiveOpen(false);
    setBulkOperationError("");
  };

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

      {/* Content */}
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
        compact={false}
        initialImages={images}
        initialVideos={videos}
        loading={loading}
        error={error}
        onRefresh={refresh}
        // Pass bulk operation handlers to MediaLibraryContent
        onBulkArchive={() => setBulkArchiveOpen(true)}
        onBulkDelete={() => setBulkDeleteOpen(true)}
      />

      {/* Bulk Delete Modal */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={handleCloseDeleteModal}
        title={`Delete ${selectedItems.size} items?`}
        description="This will permanently delete the selected items. This action cannot be undone."
        confirmLabel="Delete All"
        confirmClass="bg-red-600"
        onConfirm={handleBulkDelete}
        busy={bulkOps.loading}
        error={bulkOperationError}
      />

      {/* Bulk Archive/Restore Modal */}
      <ConfirmModal
        isOpen={bulkArchiveOpen}
        onClose={handleCloseArchiveModal}
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
        error={bulkOperationError}
      />
    </div>
  );
};

export default MediaLibrary;
