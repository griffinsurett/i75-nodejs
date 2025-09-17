import { useState } from "react";
import { Eye, Film, Download, Image as ImageIcon } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import { formatFileSize } from "../../utils/formatFileSize";
import { formatFileType } from "../../utils/formatFileType";

export default function MediaListItem({ item, onClick }) {
  const isVideo = item.type === "video";
  const [thumbnailError, setThumbnailError] = useState(false);
  const fileFormat = formatFileType(item.mimeType);

  const ListPreview = () => {
    if (isVideo) {
      const videoUrl = item.url;
      const thumbnailUrl = item.thumbnailUrl;

      if (thumbnailUrl && !thumbnailError) {
        return (
          <div className="relative w-full h-full">
            <img
              src={thumbnailUrl}
              alt={item.title || "Video thumbnail"}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setThumbnailError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-full p-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        );
      }

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
                e.target.style.display = "none";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        );
      }

      return <Film className="w-6 h-6 text-text/40" />;
    } else {
      if (item.url) {
        return (
          <img
            src={item.url}
            alt={item.altText || "Image"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.innerHTML =
                '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
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
          {isVideo ? item.title : item.altText || "Untitled"}
        </span>
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
}
