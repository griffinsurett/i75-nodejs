import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image,
  Film,
} from "lucide-react";
import { uploadAPI } from "../../services/api";
import { formatFileSize } from "../../utils/formatFileSize";
import { formatFileType } from "../../utils/formatFileType";
import { generateVideoThumbnail, VideoThumbnail } from "../videoThumbnail";

export default function MediaUploader({ onComplete }) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;

    const droppedFiles = [...e.dataTransfer.files];
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = [...e.target.files];
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      return isImage || isVideo;
    });

    const fileObjects = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type.startsWith("image/") ? "image" : "video",
      mimeType: file.type,
      status: "pending",
      progress: 0,
      error: null,
      preview: null,
      altText: file.name.replace(/\.[^/.]+$/, ""),
      title: file.name.replace(/\.[^/.]+$/, ""),
      description: "",
    }));

    // Create previews
    fileObjects.forEach(async (fileObj) => {
      if (fileObj.type === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id ? { ...f, preview: e.target.result } : f
            )
          );
        };
        reader.readAsDataURL(fileObj.file);
      } else if (fileObj.type === "video") {
        // Use the reusable utility
        const thumbnail = await generateVideoThumbnail(fileObj.file);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, preview: thumbnail } : f
          )
        );
      }
    });

    setFiles((prev) => [...prev, ...fileObjects]);

    // Start uploading immediately
    fileObjects.forEach((fileObj) => {
      uploadFile(fileObj);
    });
  };

  const uploadFile = async (fileObj) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileObj.id ? { ...f, status: "uploading", progress: 0 } : f
      )
    );

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (
              f.id === fileObj.id &&
              f.status === "uploading" &&
              f.progress < 90
            ) {
              return { ...f, progress: f.progress + 10 };
            }
            return f;
          })
        );
      }, 200);

      let response;

      if (fileObj.type === "image") {
        response = await uploadAPI.uploadImage(fileObj.file, fileObj.altText);
      } else {
        response = await uploadAPI.uploadVideo(
          fileObj.file,
          fileObj.title,
          fileObj.description
        );
      }

      clearInterval(progressInterval);

      if (response.data?.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: "success", progress: 100 } : f
          )
        );
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? {
                ...f,
                status: "error",
                error: err.response?.data?.message || "Upload failed",
              }
            : f
        )
      );
    }
  };

  const removeFile = (id) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const retryUpload = (fileObj) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileObj.id
          ? { ...f, status: "pending", error: null, progress: 0 }
          : f
      )
    );
    uploadFile(fileObj);
  };

  const allUploadsComplete =
    files.length > 0 &&
    files.every((f) => f.status === "success" || f.status === "error");

  const successCount = files.filter((f) => f.status === "success").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;

  // Preview component
  const FilePreview = ({ fileObj }) => {
    if (fileObj.type === "video") {
      return (
        <VideoThumbnail thumbnailSrc={fileObj.preview} alt={fileObj.title} />
      );
    }

    if (fileObj.type === "image" && fileObj.preview) {
      return (
        <img
          src={fileObj.preview}
          alt={fileObj.altText}
          className="w-full h-full object-cover"
        />
      );
    }

    // Default icon fallback
    return (
      <div className="w-full h-full flex items-center justify-center bg-bg2">
        {fileObj.type === "video" ? (
          <Film className="w-6 h-6 text-text/40" />
        ) : (
          <Image className="w-6 h-6 text-text/40" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border-primary hover:border-primary/50"
        }`}
      >
        <Upload className="w-16 h-16 mx-auto mb-4 text-text/40" />
        <h3 className="text-lg font-medium text-heading mb-2">
          Drop files to upload
        </h3>
        <p className="text-text/60 mb-4">or</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Select Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-sm text-text/60 mt-4">
          Accepted file types: Images and Videos
        </p>
      </div>

      {/* Upload List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-heading">
              {uploadingCount > 0
                ? `Uploading ${uploadingCount} of ${files.length} files`
                : `${successCount} files uploaded`}
            </h3>
            {allUploadsComplete && successCount > 0 && (
              <button
                onClick={onComplete}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                View Library
              </button>
            )}
          </div>

          {/* File Table */}
          <div className="bg-bg border border-border-primary rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-border-primary">
                {files.map((fileObj) => (
                  <tr key={fileObj.id} className="hover:bg-bg2/50">
                    {/* Thumbnail */}
                    <td className="p-3 w-14">
                      <div className="w-12 h-12 rounded overflow-hidden bg-bg2">
                        <FilePreview fileObj={fileObj} />
                      </div>
                    </td>

                    {/* File Name with status and progress */}
                    <td className="p-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-heading truncate">
                          {fileObj.name}
                        </span>
                        {fileObj.status === "success" && (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Progress Bar */}
                      {fileObj.status === "uploading" && (
                        <div className="mt-2 w-full bg-bg2 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${fileObj.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Error Message */}
                      {fileObj.status === "error" && (
                        <div className="mt-1 text-xs text-red-600">
                          {fileObj.error}
                        </div>
                      )}
                    </td>

                    {/* Format */}
                    <td className="p-3 text-sm text-text font-mono">
                      {formatFileType(fileObj.mimeType)}
                    </td>

                    {/* Size */}
                    <td className="p-3 text-sm text-text whitespace-nowrap">
                      {formatFileSize(fileObj.size)}
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {fileObj.status === "uploading" && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        {fileObj.status === "error" && (
                          <button
                            onClick={() => retryUpload(fileObj)}
                            className="text-primary hover:text-primary/80 text-sm px-2 py-1"
                          >
                            Retry
                          </button>
                        )}
                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="text-text/60 hover:text-text p-1"
                          disabled={fileObj.status === "uploading"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
