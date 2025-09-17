import { Eye, Film, Download, Image as ImageIcon } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
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
  onToggleSelect
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
          thumbnailSrc={item.thumbnailUrl}
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

  return (
    <tr className={`hover:bg-bg2/50 ${isSelected ? 'bg-primary/10' : ''}`}>
      {selectionMode && (
        <td className="px-4 py-3">
          <SelectionCheckbox
            isSelected={isSelected}
            onToggle={onToggleSelect}
            ariaLabel={`Select ${isVideo ? item.title : item.altText}`}
            variant="small"
          />
        </td>
      )}
      <td className="px-4 py-3">
        <div className="w-12 h-12 rounded overflow-hidden bg-bg2 flex items-center justify-center">
          <ListPreview />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-heading">
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
      <td className="px-4 py-3">
        <span className="text-sm font-mono text-text">{fileFormat}</span>
      </td>
      <td className="px-4 py-3 text-sm text-text">
        {formatFileSize(item.fileSize)}
      </td>
      <td className="px-4 py-3 text-sm text-text">
        {formatDate(item.createdAt, { variant: "short", empty: "-" })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {!selectionMode && (
            <>
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
              <EditActions
                id={item.imageId || item.videoId}
                isArchived={item.isArchived}
                api={api}
                onChanged={onChanged}
                buttonClassName="w-8 h-8"
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
}