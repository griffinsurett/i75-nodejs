// Format the MIME type to a readable format
export const formatFileType = (mimeType) => {
  if (!mimeType) return 'Unknown';
  
  const parts = mimeType.split('/');
  if (parts.length !== 2) return mimeType;
  
  const format = parts[1].toUpperCase();
  
  const formatMap = {
    'JPEG': 'JPEG',
    'JPG': 'JPEG',
    'PNG': 'PNG',
    'GIF': 'GIF',
    'WEBP': 'WEBP',
    'SVG+XML': 'SVG',
    'MP4': 'MP4',
    'WEBM': 'WEBM',
    'QUICKTIME': 'MOV',
    'X-MSVIDEO': 'AVI',
    'X-MATROSKA': 'MKV',
    'MPEG': 'MPEG'
  };
  
  return formatMap[format] || format;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};