// MediaCard.jsx
import { useState } from "react";
import { Eye, Film, Image as ImageIcon } from "lucide-react";
import DateDisplay from "../common/DateDisplay";
import ImageWithFallback from "../common/ImageWithFallback";
import { formatFileSize } from "../../utils/formatFileSize";
import { formatFileType } from "../../utils/formatFileType";
import { VideoThumbnail } from "../VideoThumbnail";
import EditActions from "../archive/EditActions";
import ArchiveBadge from "../archive/ArchiveBadge";
import SelectionCheckbox from "../selection/SelectionCheckbox";
import { imageAPI, videoAPI } from "../../services/api";
import StatusIndicator from "../common/StatusIndicator";

export default function MediaCard({
  item,
  onClick,
  onChanged,
  selectionMode,
  isSelected,
  onToggleSelect,
}) {
  const isVideo = item.type === "video";
  const fileFormat = formatFileType(item.mimeType);

  // Get the appropriate API based on media type
  const api = isVideo
    ? {
        archive: (id) => videoAPI.archiveVideo(id),
        restore: (id) => videoAPI.restoreVideo(id),
        delete: (id) => videoAPI.deleteVideo(id),
      }
    : {
        archive: (id) => imageAPI.archiveImage(id),
        restore: (id) => imageAPI.restoreImage(id),
        delete: (id) => imageAPI.deleteImage(id),
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
        isSelected ? "border-primary border-2" : "border-border-primary"
      }`}
      onClick={handleClick}
    >
      {/* Selection Checkbox - at card level */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-20">
          <SelectionCheckbox
            isSelected={isSelected}
            onToggle={onToggleSelect}
            ariaLabel={`Select ${isVideo ? item.title : item.altText}`}
          />
        </div>
      )}

      {/* Actions Menu - at card level, outside image container */}
      {!selectionMode && (
        <div
          className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <EditActions
            id={item.imageId || item.videoId}
            isArchived={item.isArchived}
            entityName={isVideo ? "video" : "image"}
            api={api}
            onChanged={onChanged}
            buttonClassName="w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/70"
          />
        </div>
      )}

      {/* Image container with overlay */}
      <div className="aspect-square relative overflow-hidden bg-bg2">
        {isVideo ? (
          <>
            <VideoThumbnail
              src={item.url}
              thumbnailSrc={item.imageUrl}
              alt={item.title || "Video thumbnail"}
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
          <ImageWithFallback
            src={item.url}
            alt={item.altText || "Image"}
            type="default"
            size="full"
            iconSize="lg"
            className="w-full h-full object-cover"
          />
        )}

        {/* Archive Badge - inside image container */}
        {item.isArchived && (
          <span className="absolute bottom-2 left-2 z-10">
            <ArchiveBadge
              archivedAt={item.archivedAt}
              scheduledDeleteAt={item.purgeAfterAt}
            />
          </span>
        )}

        {/* Hover overlay - only inside image container */}
        {!selectionMode && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Eye className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Card footer with title and metadata */}
      <div className="p-3">
        <p className="text-sm font-medium text-heading truncate">
          {isVideo
            ? item.title || "Untitled Video"
            : item.altText || "Untitled Image"}
        </p>
        <div className="flex items-center justify-between text-xs text-text/70 mt-1">
          {/* <DateDisplay
            date={item.createdAt}
            variant="compact"
            className="text-xs"
          /> */}
          <div className="flex items-center gap-2">
            <span>{formatFileSize(item.fileSize)}</span>
            {fileFormat !== "Unknown" && (
              <StatusIndicator
                status="custom"
                label={fileFormat}
                size="xs"
                showIcon={false}
                className="bg-bg2 text-text"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
