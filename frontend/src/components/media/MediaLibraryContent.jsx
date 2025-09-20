// frontend/src/components/media/MediaLibraryContent.jsx
import { useState, useEffect, useRef } from "react";
import { imageAPI, videoAPI } from "../../services/api";
import { Loader2, AlertCircle } from "lucide-react";
import MediaControls from "./MediaControls";
import MediaCard from "./MediaCard";
import MediaListItem from "./MediaListItem";
import MediaUploader from "./MediaUploader";
import ArchivedNotice from "../archive/ArchivedNotice";
import SearchInput from "../search/SearchInput";
import { useSearch } from "../search/hooks/useSearch";

export default function MediaLibraryContent({
  onSelectionChange,
  selectionMode = false,
  allowMultiple = false,
  selectedItems = new Set(),
  mediaTypeFilter = 'all',
  showArchived = false,
  showUploader = false,
  onUploaderComplete,
  compact = false,
  onMediaDataChange,
  initialImages = null,
  initialVideos = null,
  loading: externalLoading = false,
  error: externalError = '',
  onRefresh = null,
  showSearch = true, // New prop to control search visibility
  searchPlaceholder = "Search media...", // Customizable search placeholder
}) {
  const [activeTab, setActiveTab] = useState(mediaTypeFilter !== 'all' ? mediaTypeFilter + 's' : 'all');
  const [images, setImages] = useState(initialImages || []);
  const [videos, setVideos] = useState(initialVideos || []);
  const [loading, setLoading] = useState(externalLoading);
  const [error, setError] = useState(externalError);
  const [viewMode, setViewMode] = useState(compact ? "grid" : "grid");

  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    console.log('[MediaLibraryContent] Render count:', renderCount.current);
    if (renderCount.current > 50) {
      console.error('INFINITE RENDER DETECTED');
    }
  });

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

  // Only fetch if no initial data provided (for standalone use)
  const fetchMedia = async () => {
    if (initialImages !== null || initialVideos !== null) {
      // Data is provided externally, use refresh function
      if (onRefresh) {
        onRefresh();
      }
      return;
    }
    
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

  useEffect(() => {
    if (!showUploader) {
      fetchMedia();
    }
  }, [showArchived, showUploader, mediaTypeFilter]);

  // Pass filtered media to parent whenever it changes
  useEffect(() => {
    if (onMediaDataChange) {
      onMediaDataChange(filteredMedia);
    }
  }, [filteredMedia, onMediaDataChange]);

  const toggleItemSelection = (itemId) => {
    const newSelection = new Set(selectedItems);
    
    if (!allowMultiple) {
      newSelection.clear();
      newSelection.add(itemId);
    } else {
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
    }
    
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  const selectAll = () => {
    const allIds = filteredMedia.map(item => item.imageId || item.videoId);
    if (onSelectionChange) {
      onSelectionChange(new Set(allIds));
    }
  };

  const clearSelection = () => {
    if (onSelectionChange) {
      onSelectionChange(new Set());
    }
  };

  const isSelected = (itemId) => selectedItems.has(itemId);

  const handleUploaderComplete = () => {
    fetchMedia();
    if (onUploaderComplete) {
      onUploaderComplete();
    }
  };

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

  if (showUploader) {
    return <MediaUploader onComplete={handleUploaderComplete} />;
  }

  return (
    <div className="space-y-6">
      {showArchived && <ArchivedNotice />}

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
        <div className="text-center py-12">
          <p className="text-text/60">
            {isSearchActive 
              ? `No ${activeTab === 'all' ? 'media' : activeTab} found matching "${searchQuery}"`
              : `No ${activeTab === 'all' ? 'media' : activeTab} available`
            }
          </p>
        </div>
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
    </div>
  );
}