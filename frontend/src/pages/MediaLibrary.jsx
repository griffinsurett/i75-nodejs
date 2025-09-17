import { useState, useEffect, useCallback } from 'react';
import { imageAPI, videoAPI, uploadAPI } from '../services/api';
import { Loader2, AlertCircle, Image as ImageIcon, Plus, Upload } from 'lucide-react';
import MediaControls from '../components/media/MediaControls';
import MediaCard from '../components/media/MediaCard';
import MediaListItem from '../components/media/MediaListItem';
import MediaPreviewModal from '../components/media/MediaPreviewModal';
import MediaUploadModal from '../components/media/MediaUploadModal';
import ActiveArchivedTabs from '../components/archive/ActiveArchivedTabs';
import ArchivedNotice from '../components/archive/ArchivedNotice';
import useArchiveViewParam from '../hooks/useArchiveViewParam';

const MediaLibrary = () => {
  const [view, setView] = useArchiveViewParam(); // 'active' | 'archived'
  const [activeTab, setActiveTab] = useState('all');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Pass archived parameter to API calls
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
    fetchMedia();
  }, [fetchMedia]);

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

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
    fetchMedia();
  };

  const filteredMedia = getFilteredMedia();
  const isArchivedView = view === 'archived';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text/70">Loading media library...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-heading">
              {isArchivedView ? 'Archived Media' : 'Media Library'}
            </h1>
            <ActiveArchivedTabs 
              value={view} 
              onChange={setView}
              activeLabel="Active"
              archivedLabel="Archived"
            />
          </div>
          
          {!isArchivedView && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Media
            </button>
          )}
        </div>
        <p className="text-text/70">
          {isArchivedView 
            ? 'View and restore archived media files' 
            : 'Manage all images and videos in one place'}
        </p>
      </div>

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

      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 bg-bg rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto text-text/40 mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">
            {isArchivedView ? 'No archived media' : 'No media found'}
          </h3>
          <p className="text-text/70 mb-4">
            {isArchivedView 
              ? 'Archived media files will appear here'
              : searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Upload images or videos to see them here'}
          </p>
          {!isArchivedView && !searchQuery && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload Your First Media
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <MediaCard
              key={item.imageId || item.videoId}
              item={item}
              onClick={() => setSelectedItem(item)}
              onChanged={fetchMedia}
            />
          ))}
        </div>
      ) : (
        <div className="bg-bg rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg2 border-b border-border-primary">
              <tr>
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
                  onClick={() => setSelectedItem(item)}
                  onChanged={fetchMedia}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MediaPreviewModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
      
      <MediaUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default MediaLibrary;