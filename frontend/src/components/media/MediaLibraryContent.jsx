// frontend/src/components/media/MediaLibraryContent.jsx
import { useState, useEffect } from "react";
import { imageAPI, videoAPI } from "../../services/api";
import { Loader2, AlertCircle } from "lucide-react";
import MediaControls from "./MediaControls";
import MediaCard from "./MediaCard";
import MediaListItem from "./MediaListItem";
import MediaUploader from "./MediaUploader";
import ArchivedNotice from "../archive/ArchivedNotice";

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
}) {
  const [activeTab, setActiveTab] = useState(mediaTypeFilter !== 'all' ? mediaTypeFilter + 's' : 'all');
  const [images, setImages] = useState(initialImages || []);
  const [videos, setVideos] = useState(initialVideos || []);
  const [loading, setLoading] = useState(externalLoading);
  const [error, setError] = useState(externalError);
  const [viewMode, setViewMode] = useState(compact ? "grid" : "grid");
  const [searchQuery, setSearchQuery] = useState("");

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

  const getFilteredMedia = () => {
    let media = [];

    if (activeTab === "all") {
      media = [
        ...images.map((img) => ({ ...img, type: "image", url: img.imageUrl })),
        ...videos.map((vid) => ({ ...vid, type: "video", url: vid.slidesUrl })),
      ];
    } else if (activeTab === "images") {
      media = images.map((img) => ({
        ...img,
        type: "image",
        url: img.imageUrl,
      }));
    } else {
      media = videos.map((vid) => ({
        ...vid,
        type: "video",
        url: vid.slidesUrl,
      }));
    }

    if (searchQuery) {
      media = media.filter((item) => {
        const searchFields = [
          item.altText,
          item.title,
          item.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchFields.includes(searchQuery.toLowerCase());
      });
    }

    return media.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  };

  const filteredMedia = getFilteredMedia();

  // Pass filtered media to parent whenever it changes
  useEffect(() => {
    if (onMediaDataChange) {
      onMediaDataChange(filteredMedia);
    }
  }, [images, videos, activeTab, searchQuery]);

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
    <>
      {showArchived && <ArchivedNotice />}

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
      {viewMode === "grid" ? (
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
    </>
  );
}