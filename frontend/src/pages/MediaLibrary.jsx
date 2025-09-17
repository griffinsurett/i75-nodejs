// frontend/src/pages/MediaLibrary.jsx
import { useState, useEffect } from 'react';
import { imageAPI, videoAPI } from '../services/api';
import { 
  Image as ImageIcon, 
  Film, 
  Calendar, 
  Download,
  Eye,
  Loader2,
  AlertCircle,
  Search,
  Grid3x3,
  List
} from 'lucide-react';

// Format the MIME type to a readable format
const formatFileType = (mimeType) => {
  if (!mimeType) return 'Unknown';
  
  // Extract the format from mime type (e.g., "image/jpeg" -> "JPEG")
  const parts = mimeType.split('/');
  if (parts.length !== 2) return mimeType;
  
  const format = parts[1].toUpperCase();
  
  // Clean up common formats
  const formatMap = {
    'JPEG': 'JPEG',
    'JPG': 'JPEG',
    'PNG': 'PNG',
    'GIF': 'GIF',
    'WEBP': 'WEBP',
    'SVG+XML': 'SVG',
    'MP4': 'MP4',
    'WEBM': 'WEBM',
    'QUICKTIME': 'MOV',
    'X-MSVIDEO': 'AVI',
    'X-MATROSKA': 'MKV',
    'MPEG': 'MPEG'
  };
  
  return formatMap[format] || format;
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const MediaLibrary = () => {
  const [activeTab, setActiveTab] = useState('all'); // all, images, videos
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch media
  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setError('');
      
      try {
        const [imagesRes, videosRes] = await Promise.all([
          imageAPI.getAllImages(),
          videoAPI.getAllVideos()
        ]);

        if (imagesRes.data?.success) {
          setImages(imagesRes.data.data || []);
        }
        if (videosRes.data?.success) {
          setVideos(videosRes.data.data || []);
        }
      } catch (err) {
        setError('Failed to load media library');
        console.error('Error fetching media:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

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

  // Apply search filter
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

  // Sort by createdAt (newest first)
  return media.sort((a, b) => 
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
};

  const filteredMedia = getFilteredMedia();

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-heading mb-2">Media Library</h1>
        <p className="text-text/70">Manage all images and videos in one place</p>
      </div>

      {/* Controls Bar */}
      <div className="bg-bg rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-bg2 text-text hover:bg-bg3'
              }`}
            >
              All ({images.length + videos.length})
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'images' 
                  ? 'bg-primary text-white' 
                  : 'bg-bg2 text-text hover:bg-bg3'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Images ({images.length})
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'videos' 
                  ? 'bg-primary text-white' 
                  : 'bg-bg2 text-text hover:bg-bg3'
              }`}
            >
              <Film className="w-4 h-4" />
              Videos ({videos.length})
            </button>
          </div>

          {/* Search and View Mode */}
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/50" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 bg-bg2 border border-border-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex gap-1 bg-bg2 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-bg text-primary' : 'text-text/70 hover:text-text'}`}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-bg text-primary' : 'text-text/70 hover:text-text'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 bg-bg rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto text-text/40 mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">No media found</h3>
          <p className="text-text/70">
            {searchQuery 
              ? 'Try adjusting your search terms' 
              : 'Upload images or videos to see them here'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <MediaCard
              key={item.image_id || item.video_id}
              item={item}
              onClick={() => setSelectedItem(item)}
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
                  key={item.image_id || item.video_id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {selectedItem && (
        <MediaPreviewModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

// MediaCard Component
const MediaCard = ({ item, onClick }) => {
  const isVideo = item.type === 'video';
  const [thumbnailError, setThumbnailError] = useState(false);
  const [videoPreviewError, setVideoPreviewError] = useState(false);
  const fileFormat = formatFileType(item.mime_type);
  
  // Video thumbnail or preview component
  const VideoContent = () => {
    const videoUrl = item.url;
    const thumbnailUrl = item.thumbnail_url;
    
    // Priority 1: Use thumbnail image if available
    if (thumbnailUrl && !thumbnailError) {
      return (
        <img
          src={thumbnailUrl}
          alt={item.title || 'Video thumbnail'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setThumbnailError(true)}
        />
      );
    }
    
    // Priority 2: Try video preview if no thumbnail
    if (videoUrl && !videoPreviewError && !thumbnailUrl) {
      return (
        <video
          src={videoUrl}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            // Seek to 1 second for better frame
            if (e.target.duration > 1) {
              e.target.currentTime = 1;
            }
          }}
          onError={() => setVideoPreviewError(true)}
        />
      );
    }
    
    // Priority 3: Fallback placeholder
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <Film className="w-12 h-12 text-gray-500" />
      </div>
    );
  };
  
  return (
    <div 
      className="bg-bg rounded-lg overflow-hidden border border-border-primary hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden bg-bg2">
        {isVideo ? (
          <>
            {/* Video content (thumbnail, preview, or placeholder) */}
            <VideoContent />
            
            {/* Play button overlay - always shown for videos */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                <svg className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Eye className="w-8 h-8 text-white" />
            </div>
            
            {/* Format badge */}
            {fileFormat !== 'Unknown' && (
              <span className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                {fileFormat}
              </span>
            )}
          </>
        ) : (
          <>
            {/* Image handling */}
            {item.url ? (
              <img
                src={item.url}
                alt={item.alt_text || 'Image'}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  console.error('Image failed to load:', item.url);
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-text/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-8 h-8 text-white" />
            </div>
            
            {/* Format badge for images */}
            {fileFormat !== 'Unknown' && (
              <span className="absolute top-2 right-2 bg-white/90 text-gray-800 px-2 py-1 rounded text-xs backdrop-blur-sm">
                {fileFormat}
              </span>
            )}
          </>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-heading truncate">
          {isVideo ? (item.title || 'Untitled Video') : (item.alt_text || 'Untitled Image')}
        </p>
        <div className="flex items-center justify-between text-xs text-text/70 mt-1">
          <span>{item.created_at ? formatDate(item.created_at) : 'Unknown date'}</span>
          <span>{formatFileSize(item.file_size)}</span>
        </div>
      </div>
    </div>
  );
};

// MediaListItem Component (List View)
const MediaListItem = ({ item, onClick }) => {
  const isVideo = item.type === 'video';
  const [thumbnailError, setThumbnailError] = useState(false);
  const fileFormat = formatFileType(item.mime_type);
  
  // Preview component for list view
  const ListPreview = () => {
    if (isVideo) {
      const videoUrl = item.url;
      const thumbnailUrl = item.thumbnail_url;
      
      // Try thumbnail first
      if (thumbnailUrl && !thumbnailError) {
        return (
          <div className="relative w-full h-full">
            <img
              src={thumbnailUrl}
              alt={item.title || 'Video thumbnail'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setThumbnailError(true)}
            />
            {/* Small play icon overlay for videos */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-full p-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
        );
      }
      
      // Try video preview as fallback
      if (videoUrl && !thumbnailUrl) {
        return (
          <div className="relative w-full h-full">
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                if (e.target.duration > 1) {
                  e.target.currentTime = 1;
                }
              }}
              onError={() => {
                // If video fails, show film icon
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
        );
      }
      
      // Fallback to film icon
      return <Film className="w-6 h-6 text-text/40" />;
    } else {
      // For images
      if (item.url) {
        return (
          <img
            src={item.url}
            alt={item.alt_text || 'Image'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
            }}
          />
        );
      }
      return <ImageIcon className="w-6 h-6 text-text/40" />;
    }
  };
  
  return (
    <tr className="hover:bg-bg2/50 cursor-pointer" onClick={onClick}>
      <td className="px-4 py-3">
        <div className="w-12 h-12 rounded overflow-hidden bg-bg2 flex items-center justify-center">
          <ListPreview />
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-heading">
          {isVideo ? item.title : (item.alt_text || 'Untitled')}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          isVideo ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {isVideo ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
          {isVideo ? 'Video' : 'Image'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-mono text-text">
          {fileFormat}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-text">
        {formatFileSize(item.file_size)}
      </td>
      <td className="px-4 py-3 text-sm text-text">
        {formatDate(item.created_at)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button 
            className="text-primary hover:text-primary/80"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye className="w-4 h-4" />
          </button>
          <a 
            href={item.url} 
            download 
            onClick={(e) => e.stopPropagation()}
            className="text-text hover:text-heading"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </td>
    </tr>
  );
};

// Media Preview Modal
const MediaPreviewModal = ({ item, onClose }) => {
  const isVideo = item.type === 'video';
  const fileFormat = formatFileType(item.mime_type);
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-bg rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border-primary flex items-center justify-between">
          <h3 className="text-lg font-semibold text-heading">
            {isVideo ? item.title : (item.alt_text || 'Media Preview')}
          </h3>
          <button
            onClick={onClose}
            className="text-text hover:text-heading p-2 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            {isVideo ? (
              <video
                src={item.url}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
            ) : (
              <img
                src={item.url}
                alt={item.alt_text || 'Image'}
                className="w-full rounded-lg"
              />
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text/70">Type:</span>
              <span className="text-heading">{isVideo ? 'Video' : 'Image'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text/70">Format:</span>
              <span className="text-heading font-mono">{fileFormat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text/70">Size:</span>
              <span className="text-heading">{formatFileSize(item.file_size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text/70">Uploaded:</span>
              <span className="text-heading">{formatDate(item.created_at)}</span>
            </div>
            {item.description && (
              <div className="pt-2 border-t border-border-primary">
                <span className="text-text/70">Description:</span>
                <p className="text-heading mt-1">{item.description}</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <a
              href={item.url}
              download
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;