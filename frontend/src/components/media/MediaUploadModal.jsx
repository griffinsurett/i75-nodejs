import { useState } from 'react';
import { Upload, X, Film, Image, Loader2 } from 'lucide-react';
import Modal from '../Modal';
import { uploadAPI } from '../../services/api';

export default function MediaUploadModal({ isOpen, onClose, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      resetForm();
      return;
    }

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Please select an image or video file');
      return;
    }

    // Validate file size (50MB limit for images, 500MB for videos)
    const maxSize = isImage ? 50 * 1024 * 1024 : 500 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size exceeds ${isImage ? '50MB' : '500MB'} limit`);
      return;
    }

    setError('');
    setSelectedFile(file);
    setMediaType(isImage ? 'image' : 'video');

    // Create preview
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(URL.createObjectURL(file));
    }

    // Set default title from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!title) {
      setTitle(nameWithoutExt);
      setAltText(nameWithoutExt);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview('');
    setMediaType('');
    setTitle('');
    setAltText('');
    setDescription('');
    setError('');
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      let response;
      
      if (mediaType === 'image') {
        response = await uploadAPI.uploadImage(selectedFile, altText || title);
      } else {
        response = await uploadAPI.uploadVideo(selectedFile, title, description);
      }

      if (response.data?.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onClose();
      resetForm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="w-screen h-screen bg-bg"
    //   closeButton={false}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-heading flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Media
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* File Input */}
        {!selectedFile ? (
          <div className="mb-6">
            <label className="block w-full">
              <div className="border-2 border-dashed border-border-primary rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-text/40" />
                <p className="text-text mb-2">Click to select or drag and drop</p>
                <p className="text-sm text-text/60">
                  Images (max 50MB) or Videos (max 500MB)
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </label>
          </div>
        ) : (
          <>
            {/* Preview */}
            <div className="mb-6">
              <div className="relative bg-bg2 rounded-lg overflow-hidden">
                {mediaType === 'image' ? (
                  <>
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      Image
                    </div>
                  </>
                ) : (
                  <>
                    <video
                      src={preview}
                      controls
                      className="w-full max-h-64"
                    />
                    <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      Video
                    </div>
                  </>
                )}
                <button
                  onClick={resetForm}
                  disabled={uploading}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-text/60">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  {mediaType === 'video' ? 'Title' : 'Alt Text'} *
                </label>
                <input
                  type="text"
                  value={mediaType === 'video' ? title : altText}
                  onChange={(e) => 
                    mediaType === 'video' 
                      ? setTitle(e.target.value)
                      : setAltText(e.target.value)
                  }
                  className="w-full px-3 py-2 bg-bg2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={mediaType === 'video' ? 'Enter video title' : 'Describe the image'}
                  disabled={uploading}
                />
              </div>

              {mediaType === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-bg2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter video description (optional)"
                    rows={3}
                    disabled={uploading}
                  />
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && uploadProgress > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text">Uploading...</span>
                  <span className="text-text">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-bg2 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-sm border border-border-primary rounded-lg hover:bg-bg2 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={
              !selectedFile || 
              uploading || 
              (mediaType === 'video' ? !title : !altText)
            }
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}