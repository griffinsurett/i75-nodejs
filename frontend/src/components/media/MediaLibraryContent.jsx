// frontend/src/components/media/MediaLibraryContent.jsx
import { useState, useEffect } from "react";
import { imageAPI, videoAPI } from "../../services/api";
import { Image as ImageIcon, Film, FileText } from "lucide-react";
import MediaControls from "./MediaControls";
import MediaCard from "./MediaCard";
import MediaListItem from "./MediaListItem";
import MediaUploader from "./MediaUploader";
import ArchivedNotice from "../archive/ArchivedNotice";
import SearchInput from "../search/SearchInput";
import EmptyState from "../common/EmptyState";
import { useSearch } from "../search/hooks/useSearch";
import useSelectionMode from "../../hooks/useSelectionMode";
import useBulkOperations from "../../hooks/useBulkOperations";
import BulkActionsBar from "../selection/BulkActionsBar";
import PageLoadingState from "../common/PageLoadingState";
import PageErrorState from "../common/PageErrorState";

export default function MediaLibraryContent({
  onSelectionChange,
  selectionMode: externalSelectionMode = false,
  allowMultiple = false,
  selectedItems: externalSelectedItems = new Set(),
  mediaTypeFilter = 'all',
  showArchived = false,
  showUploader = false,
  onUploaderComplete,
  compact = false,
  initialImages = null,
  initialVideos = null,
  loading: externalLoading = false,
  error: externalError = '',
  onRefresh = null,
  showSearch = true,
  searchPlaceholder = "Search media...",
}) {
  const [activeTab, setActiveTab] = useState(mediaTypeFilter !== 'all' ? mediaTypeFilter + 's' : 'all');
  const [images, setImages] = useState(initialImages || []);
  const [videos, setVideos] = useState(initialVideos || []);
  const [loading, setLoading] = useState(externalLoading);
  const [error, setError] = useState(externalError);
  const [viewMode, setViewMode] = useState(compact ? "grid" : "grid");

  // Use selection mode hook if not controlled externally
  const internalSelection = useSelectionMode();
  const {
    loading: bulkLoading,
    error: bulkError,
    executeBulkOperation
  } = useBulkOperations();

  // Use external or internal selection state
  const selectionMode = externalSelectionMode || internalSelection.selectionMode;
  const selectedItems = externalSelectedItems.size > 0 ? externalSelectedItems : internalSelection.selectedItems;
  const toggleItemSelection = onSelectionChange ? 
    (id) => {
      const newSelection = new Set(selectedItems);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        if (!allowMultiple) newSelection.clear();
        newSelection.add(id);
      }
      onSelectionChange(newSelection);
    } : internalSelection.toggleItemSelection;

  // Determine if we're in controlled mode (data provided externally)
  const isControlledMode = initialImages !== null && initialVideos !== null;

  // Prepare media data for search
  const allMedia = [
    ...images.map((img) => ({ ...img, type: "image", url: img.imageUrl })),
    ...videos.map((vid) => ({ ...vid, type: "video", url: vid.slidesUrl })),
  ];

  // Filter media by active tab first
  const tabFilteredMedia = (() => {
    if (activeTab === "images") {
      return images.map((img) => ({ ...img, type: "image", url: img.imageUrl }));
    } else if (activeTab === "videos") {
      return videos.map((vid) => ({ ...vid, type: "video", url: vid.slidesUrl }));
    } else {
      return allMedia;
    }
  })();

  // Use search hook with media-specific search configuration
  const {
    searchQuery,
    filteredData: searchFilteredMedia,
    setSearchQuery,
    clearSearch,
    isSearchActive,
    searchStats,
  } = useSearch(tabFilteredMedia, {
    searchFields: ['altText', 'title', 'description'],
    debounceMs: 300,
    caseSensitive: false,
  });

  // Sort filtered media by creation date
  const filteredMedia = searchFilteredMedia.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  // Use provided data if available
  useEffect(() => {
    if (initialImages !== null) {
      setImages(initialImages);
    }
    if (initialVideos !== null) {
      setVideos(initialVideos);
    }
  }, [initialImages, initialVideos]);

  // Use external loading/error states
  useEffect(() => {
    setLoading(externalLoading);
  }, [externalLoading]);

  useEffect(() => {
    setError(externalError);
  }, [externalError]);

  // Fetch media function
  const fetchMedia = async () => {
    // Don't fetch if in controlled mode
    if (isControlledMode) return;
    
    try {
      setLoading(true);
      setError('');
      
      const params = showArchived ? { archived: 'true' } : {};
      const requests = [];

      if (mediaTypeFilter === 'all' || mediaTypeFilter === 'image') {
        requests.push(imageAPI.getAllImages(params));
      }
      
      if (mediaTypeFilter === 'all' || mediaTypeFilter === 'video') {
        requests.push(videoAPI.getAllVideos(params));
      }

      const responses = await Promise.all(requests);
      let imageIndex = 0;

      if (mediaTypeFilter === 'all' || mediaTypeFilter === 'image') {
        const imagesRes = responses[imageIndex++];
        if (imagesRes.data?.success) {
          setImages(imagesRes.data.data || []);
        } else {
          setImages([]);
        }
      }

      if (mediaTypeFilter === 'all' || mediaTypeFilter === 'video') {
        const videosRes = responses[responses.length - 1];
        if (videosRes.data?.success) {
          const videoData = videosRes.data.data.map((item) => {
            if (item.videos) {
              return {
                ...item.videos,
                imageUrl: item.images?.imageUrl,
                imageAlt: item.images?.altText,
              };
            }
            return item;
          });
          setVideos(videoData);
        } else {
          setVideos([]);
        }
      }
    } catch (err) {
      setError('Failed to load media library');
      console.error('Error fetching media:', err);
      setImages([]);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch if not in controlled mode and not showing uploader
  useEffect(() => {
    if (!isControlledMode && !showUploader) {
      fetchMedia();
    }
  }, [showArchived, showUploader, mediaTypeFilter]);

  // Bulk operations handlers
  const handleBulkArchive = async () => {
    const operation = async (id) => {
      const item = filteredMedia.find(m => (m.imageId || m.videoId) === id);
      if (item?.type === 'video') {
        return videoAPI.archiveVideo(id);
      } else {
        return imageAPI.archiveImage(id);
      }
    };

    await executeBulkOperation(selectedItems, operation, () => {
      if (isControlledMode && onRefresh) {
        onRefresh();
      } else {
        fetchMedia();
      }
      if (onSelectionChange) {
        onSelectionChange(new Set());
      } else {
        internalSelection.clearSelection();
      }
    });
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedItems.size} items permanently?`)) return;
    
    const operation = async (id) => {
      const item = filteredMedia.find(m => (m.imageId || m.videoId) === id);
      if (item?.type === 'video') {
        return videoAPI.deleteVideo(id);
      } else {
        return imageAPI.deleteImage(id);
      }
    };

    await executeBulkOperation(selectedItems, operation, () => {
      if (isControlledMode && onRefresh) {
        onRefresh();
      } else {
        fetchMedia();
      }
      if (onSelectionChange) {
        onSelectionChange(new Set());
      } else {
        internalSelection.clearSelection();
      }
    });
  };

  const selectAll = () => {
    const allIds = filteredMedia.map(item => item.imageId || item.videoId);
    if (onSelectionChange) {
      onSelectionChange(new Set(allIds));
    } else {
      internalSelection.selectAll(allIds);
    }
  };

  const clearSelection = () => {
    if (onSelectionChange) {
      onSelectionChange(new Set());
    } else {
      internalSelection.clearSelection();
    }
  };

  const isSelected = (itemId) => selectedItems.has(itemId);

  const handleUploaderComplete = () => {
    // Only fetch if not in controlled mode
    if (!isControlledMode) {
      fetchMedia();
    }
    if (onUploaderComplete) {
      onUploaderComplete();
    }
  };

  // Get appropriate icon based on active tab
  const getEmptyIcon = () => {
    if (activeTab === "images") return ImageIcon;
    if (activeTab === "videos") return Film;
    return FileText;
  };

  if (loading && !showUploader) {
    return <PageLoadingState message="Loading media library..." />;
  }

  if (error && !showUploader) {
    return <PageErrorState error={error} />;
  }

  if (showUploader) {
    return <MediaUploader onComplete={handleUploaderComplete} />;
  }

  return (
    <div className="space-y-6">
      {showArchived && <ArchivedNotice />}

      {/* Bulk Actions Bar */}
      {selectionMode && selectedItems.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedItems.size}
          totalCount={filteredMedia.length}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onArchive={showArchived ? null : handleBulkArchive}
          onDelete={handleBulkDelete}
          archiveLabel="Archive Selected"
        />
      )}

      {/* Error from bulk operations */}
      {bulkError && (
        <PageErrorState error={bulkError} />
      )}

      {/* Media Controls */}
      <MediaControls
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        imageCount={images.length}
        videoCount={videos.length}
      />

      {/* Search Input */}
      {showSearch && (
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={clearSearch}
          placeholder={searchPlaceholder}
        />
      )}

      {/* Search Results Info */}
      {isSearchActive && (
        <div className="flex items-center justify-between text-sm text-text/70 px-1">
          <span>
            {searchStats.hasResults 
              ? `Showing ${searchStats.filteredItems} of ${searchStats.totalItems} items`
              : `No results found for "${searchQuery}"`
            }
          </span>
          {searchStats.filteredItems > 0 && (
            <button
              onClick={clearSearch}
              className="text-primary hover:text-primary/80 underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <EmptyState
          icon={getEmptyIcon()}
          title={
            isSearchActive 
              ? `No ${activeTab === 'all' ? 'media' : activeTab} found`
              : `No ${activeTab === 'all' ? 'media' : activeTab} available`
          }
          description={
            isSearchActive 
              ? `No ${activeTab === 'all' ? 'media' : activeTab} found matching "${searchQuery}"`
              : `Upload your first ${activeTab === 'all' ? 'media file' : activeTab === 'images' ? 'image' : 'video'} to get started`
          }
        />
      ) : viewMode === "grid" ? (
        <div className={`grid gap-4 ${
          compact 
            ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }`}>
          {filteredMedia.map((item) => (
            <MediaCard
              key={item.imageId || item.videoId}
              item={item}
              onClick={() => !selectionMode && toggleItemSelection(item.imageId || item.videoId)}
              onChanged={() => {
                if (isControlledMode && onRefresh) {
                  onRefresh();
                } else {
                  fetchMedia();
                }
              }}
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
                      checked={
                        selectedItems.size === filteredMedia.length &&
                        filteredMedia.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAll();
                        } else {
                          clearSelection();
                        }
                      }}
                      className="rounded border-border-primary"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Preview
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Format
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Date
                </th>
                {!selectionMode && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {filteredMedia.map((item) => (
                <MediaListItem
                  key={item.imageId || item.videoId}
                  item={item}
                  onClick={() => !selectionMode && toggleItemSelection(item.imageId || item.videoId)}
                  onChanged={() => {
                    if (isControlledMode && onRefresh) {
                      onRefresh();
                    } else {
                      fetchMedia();
                    }
                  }}
                  selectionMode={selectionMode}
                  isSelected={isSelected(item.imageId || item.videoId)}
                  onToggleSelect={() => toggleItemSelection(item.imageId || item.videoId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}