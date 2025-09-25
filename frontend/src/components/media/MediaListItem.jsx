// frontend/src/components/media/MediaListItem.jsx
import { Eye, Film, Download, Image as ImageIcon } from "lucide-react";
import DateDisplay from "../common/DateDisplay";
import { formatFileSize } from "../../utils/formatFileSize";
import { formatFileType } from "../../utils/formatFileType";
import { VideoThumbnail } from "../VideoThumbnail";
import EditActions from "../archive/EditActions";
import ArchiveBadge from "../archive/ArchiveBadge";
import SelectionCheckbox from "../selection/SelectionCheckbox";
import { imageAPI, videoAPI } from "../../services/api";

export default function MediaListItem({
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

  const ListPreview = () => {
    if (isVideo) {
      return (
        <VideoThumbnail
          src={item.url}
          thumbnailSrc={item.imageUrl}
          alt={item.title || "Video thumbnail"}
        />
      );
    }

    if (item.url) {
      return (
        <img
          src={item.url}
          alt={item.altText || "Image"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      );
    }

    return <ImageIcon className="w-6 h-6 text-text/40" />;
  };

  // Handle row click
  const handleRowClick = (e) => {
    // Don't trigger if clicking on interactive elements
    if (
      e.target.closest('button') || 
      e.target.closest('a') || 
      e.target.closest('input') ||
      e.target.closest('.actions-cell') // Add class to actions cell
    ) {
      return;
    }

    if (selectionMode) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <tr 
      className={`hover:bg-bg2/50 cursor-pointer transition-colors ${
        isSelected ? "bg-primary/10" : ""
      }`}
      onClick={handleRowClick}
    >
      {selectionMode && (
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <SelectionCheckbox
            isSelected={isSelected}
            onToggle={onToggleSelect}
            ariaLabel={`Select ${isVideo ? item.title : item.altText}`}
            variant="small"
          />
        </td>
      )}
      
      {/* Preview */}
      <td className="px-4 py-3">
        <div className="w-12 h-12 rounded overflow-hidden bg-bg2 flex items-center justify-center">
          <ListPreview />
        </div>
      </td>
      
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-heading font-medium">
            {isVideo ? item.title : item.altText || "Untitled"}
          </span>
          {item.isArchived && (
            <ArchiveBadge
              archivedAt={item.archivedAt}
              scheduledDeleteAt={item.purgeAfterAt}
            />
          )}
        </div>
      </td>
      
      {/* Type */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            isVideo
              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          }`}
        >
          {isVideo ? (
            <Film className="w-3 h-3" />
          ) : (
            <ImageIcon className="w-3 h-3" />
          )}
          {isVideo ? "Video" : "Image"}
        </span>
      </td>
      
      {/* Format & Size Combined Column (Optional Enhancement) */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <span className="text-sm font-mono text-text block">
            {fileFormat}
          </span>
          <span className="text-xs text-text/60">
            {formatFileSize(item.fileSize)}
          </span>
        </div>
      </td>
      
      {/* Date */}
      <td className="px-4 py-3">
        <DateDisplay
          date={item.createdAt}
          variant="compact"
          className="text-sm"
        />
      </td>
      
      {/* Actions */}
      {!selectionMode && (
        <td className="px-4 py-3 actions-cell" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <button
              className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <a
              href={item.url}
              download
              onClick={(e) => e.stopPropagation()}
              className="text-text hover:text-heading p-1 rounded hover:bg-bg2 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
            <EditActions
              id={item.imageId || item.videoId}
              isArchived={item.isArchived}
              entityName={isVideo ? "video" : "image"}
              api={api}
              onChanged={onChanged}
              buttonClassName="w-8 h-8"
            />
          </div>
        </td>
      )}
    </tr>
  );
}