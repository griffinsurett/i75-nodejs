import { Download } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import { formatFileSize } from "../../utils/formatFileSize";
import { formatFileType } from "../../utils/formatFileType";

export default function MediaPreviewModal({ item, onClose }) {
  if (!item) return null;

  const isVideo = item.type === "video";
  const fileFormat = formatFileType(item.mimeType);

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
            {isVideo ? item.title : item.altText || "Media Preview"}
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
                alt={item.altText || "Image"}
                className="w-full rounded-lg"
              />
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text/70">Type:</span>
              <span className="text-heading">
                {isVideo ? "Video" : "Image"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text/70">Format:</span>
              <span className="text-heading font-mono">{fileFormat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text/70">Size:</span>
              <span className="text-heading">
                {formatFileSize(item.fileSize)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text/70">Uploaded:</span>
              <span className="text-heading">
                {formatDate(item.createdAt, { variant: "short" })}
              </span>
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
}
