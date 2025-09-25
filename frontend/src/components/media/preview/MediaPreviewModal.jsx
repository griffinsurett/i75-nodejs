// frontend/src/components/media/MediaPreviewModal.jsx
import { Download, X, Film, Image as ImageIcon } from "lucide-react";
import Modal from "../../Modal";
import DateDisplay from "../../common/DateDisplay";
import { formatFileSize } from "../../../utils/formatFileSize";
import { formatFileType } from "../../../utils/formatFileType";

export default function MediaPreviewModal({ item, onClose }) {
  if (!item) return null;

  const isVideo = item.type === "video";
  const fileFormat = formatFileType(item.mimeType);

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      className="bg-bg rounded-xl shadow-2xl p-0 overflow-hidden"
      overlayClass="bg-black/80 backdrop-blur-sm"
      closeButton={false}
      variant="centered"
    >
      <div className="w-[90vw] max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between bg-bg">
          <div className="flex items-center gap-3">
            {isVideo ? (
              <Film className="w-5 h-5 text-primary" />
            ) : (
              <ImageIcon className="w-5 h-5 text-primary" />
            )}
            <h3 className="text-lg font-semibold text-heading truncate max-w-[500px]">
              {isVideo ? item.title : item.altText || "Media Preview"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg2 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close preview"
          >
            <X className="w-5 h-5 text-text" />
          </button>
        </div>

        {/* Media Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-black/95">
          <div className="flex items-center justify-center min-h-[400px] p-8">
            {isVideo ? (
              <video
                src={item.url}
                controls
                autoPlay
                className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
                poster={item.imageUrl}
              />
            ) : (
              <img
                src={item.url}
                alt={item.altText || "Image"}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-bg border-t border-border-primary p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Left Column - File Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-heading mb-2">
                File Information
              </h4>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-text/70">Type:</span>
                <span className="text-sm text-heading font-medium flex items-center gap-1">
                  {isVideo ? (
                    <>
                      <Film className="w-3 h-3" />
                      Video
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3" />
                      Image
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-text/70">Format:</span>
                <span className="text-sm text-heading font-mono bg-bg2 px-2 py-0.5 rounded">
                  {fileFormat}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-text/70">Size:</span>
                <span className="text-sm text-heading font-medium">
                  {formatFileSize(item.fileSize)}
                </span>
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-heading mb-2">Details</h4>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-text/70">Uploaded:</span>
                <DateDisplay
                  date={item.createdAt}
                  variant="compact"
                  className="text-sm"
                />
              </div>

              {item.dimensions && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-text/70">Dimensions:</span>
                  <span className="text-sm text-heading font-mono">
                    {item.dimensions.width} × {item.dimensions.height}
                  </span>
                </div>
              )}

              {isVideo && item.duration && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-text/70">Duration:</span>
                  <span className="text-sm text-heading">
                    {formatDuration(item.duration)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="border-t border-border-primary pt-4 mb-4">
              <h4 className="text-sm font-medium text-heading mb-2">
                Description
              </h4>
              <p className="text-sm text-text">{item.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-border-primary">
            <div className="text-xs text-text/50">
              ID:{" "}
              <span className="font-mono">{item.imageId || item.videoId}</span>
            </div>

            <div className="flex gap-2">
              <a
                href={item.url}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border border-border-primary rounded-lg hover:bg-bg2 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Helper function to format video duration
function formatDuration(seconds) {
  if (!seconds) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
