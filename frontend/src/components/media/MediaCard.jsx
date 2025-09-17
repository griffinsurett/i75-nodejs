import { useState } from 'react';
import { Eye, Film, Image as ImageIcon, Check } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { formatFileSize } from '../../utils/formatFileSize';
import { formatFileType } from '../../utils/formatFileType';
import { VideoThumbnail } from '../VideoThumbnail';
import EditActions from '../archive/EditActions';
import ArchiveBadge from '../archive/ArchiveBadge';
import { imageAPI, videoAPI } from '../../services/api';

export default function MediaCard({ 
  item, 
  onClick, 
  onChanged,
  selectionMode,
  isSelected,
  onToggleSelect
}) {
  const isVideo = item.type === 'video';
  const fileFormat = formatFileType(item.mimeType);

  // Get the appropriate API based on media type
  const api = isVideo
    ? {
        archive: (id) => videoAPI.archiveVideo(id),
        restore: (id) => videoAPI.restoreVideo(id),
        delete: (id) => videoAPI.deleteVideo(id)
      }
    : {
        archive: (id) => imageAPI.archiveImage(id),
        restore: (id) => imageAPI.restoreImage(id),
        delete: (id) => imageAPI.deleteImage(id)
      };

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <div
      className={`bg-bg rounded-lg overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer group relative ${
        isSelected ? 'border-primary border-2' : 'border-border-primary'
      }`}
      onClick={handleClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-20">
          <div className={`w-6 h-6 rounded border-2 ${
            isSelected 
              ? 'bg-primary border-primary' 
              : 'bg-white/90 border-gray-400 hover:border-primary'
          } flex items-center justify-center`}>
            {isSelected && (
              <Check className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Actions Menu - only show when not in selection mode */}
      {!selectionMode && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditActions
            id={item.imageId || item.videoId}
            isArchived={item.isArchived}
            api={api}
            onChanged={onChanged}
            buttonClassName="w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/70"
          />
        </div>
      )}

      <div 
        className="aspect-square relative overflow-hidden bg-bg2"
      >
        {isVideo ? (
          <>
            <VideoThumbnail 
              src={item.url} 
              thumbnailSrc={item.thumbnailUrl} 
              alt={item.title || 'Video thumbnail'}
              showPlayButton={false}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                <svg
                  className="w-10 h-10 text-white drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <>
            {item.url ? (
              <img
                src={item.url}
                alt={item.altText || 'Image'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-text/40" />
              </div>
            )}
          </>
        )}

        {/* Archive Badge */}
        {item.isArchived && (
          <span className="absolute bottom-2 left-2">
            <ArchiveBadge
              archivedAt={item.archivedAt}
              scheduledDeleteAt={item.purgeAfterAt}
            />
          </span>
        )}

        {/* Hover overlay - only show when not in selection mode */}
        {!selectionMode && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-heading truncate">
          {isVideo
            ? item.title || 'Untitled Video'
            : item.altText || 'Untitled Image'}
        </p>
        <div className="flex items-center justify-between text-xs text-text/70 mt-1">
          <span>
            {formatDate(item.createdAt, {
              variant: 'short',
              empty: 'Unknown date',
            })}
          </span>
          <div className="flex items-center gap-2">
            <span>{formatFileSize(item.fileSize)}</span>
            {fileFormat !== 'Unknown' && (
              <span className="bg-bg2 text-text px-2 py-0.5 rounded text-xs font-medium">
                {fileFormat}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}