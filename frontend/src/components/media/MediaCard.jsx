import { useState } from "react";
import { Eye, Film, Image as ImageIcon } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import { formatFileSize } from "../../utils/formatFileSize";
import { formatFileType } from "../../utils/formatFileType";

export default function MediaCard({ item, onClick }) {
  const isVideo = item.type === "video";
  const [thumbnailError, setThumbnailError] = useState(false);
  const [videoPreviewError, setVideoPreviewError] = useState(false);
  const fileFormat = formatFileType(item.mimeType);

  const VideoContent = () => {
    const videoUrl = item.url;
    const thumbnailUrl = item.thumbnailUrl;

    if (thumbnailUrl && !thumbnailError) {
      return (
        <img
          src={thumbnailUrl}
          alt={item.title || "Video thumbnail"}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setThumbnailError(true)}
        />
      );
    }

    if (videoUrl && !videoPreviewError && !thumbnailUrl) {
      return (
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
          onError={() => setVideoPreviewError(true)}
        />
      );
    }

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
            <VideoContent />
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
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </>
        ) : (
          <>
            {item.url ? (
              <img
                src={item.url}
                alt={item.altText || "Image"}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  console.error("Image failed to load:", item.url);
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML =
                    '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
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
          </>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-heading truncate">
          {isVideo
            ? item.title || "Untitled Video"
            : item.altText || "Untitled Image"}
        </p>
        <div className="flex items-center justify-between text-xs text-text/70 mt-1">
          <span>
            {formatDate(item.createdAt, {
              variant: "short",
              empty: "Unknown date",
            })}
          </span>
          <div className="flex items-center gap-2">
            <span>{formatFileSize(item.fileSize)}</span>
            {fileFormat !== "Unknown" && (
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
