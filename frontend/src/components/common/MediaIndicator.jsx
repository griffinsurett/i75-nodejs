// frontend/src/components/common/MediaIndicator.jsx
import { Play, Image, FileText, User } from 'lucide-react';

const icons = {
  video: Play,
  image: Image,
  document: FileText,
  user: User
};

export default function MediaIndicator({ type, title, className = "" }) {
  const Icon = icons[type] || FileText;
  
  return (
    <div className={`flex items-center text-sm text-text/70 ${className}`}>
      <Icon className="w-4 h-4 mr-1" />
      <span>{title}</span>
    </div>
  );
}