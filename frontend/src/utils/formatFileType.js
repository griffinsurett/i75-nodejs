/**
 * Formats MIME type to readable format
 * @param {string} mimeType - MIME type string
 * @returns {string} Formatted file type
 */
export function formatFileType(mimeType) {
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
}