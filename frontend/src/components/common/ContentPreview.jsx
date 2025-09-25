// frontend/src/components/common/ContentPreview.jsx
export default function ContentPreview({ content, maxLength = 200, className = "" }) {
  if (!content) return null;
  
  const preview = content.length > maxLength 
    ? `${content.substring(0, maxLength)}...` 
    : content;
    
  return (
    <div className={className}>
      <div className="text-xs text-text/60 mb-1">Content Preview:</div>
      <div className="text-sm text-text bg-bg2 p-3 rounded border-l-2 border-primary/20">
        {preview}
      </div>
    </div>
  );
}