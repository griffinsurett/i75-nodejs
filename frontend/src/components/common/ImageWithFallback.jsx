// frontend/src/components/common/ImageWithFallback.jsx
import { FileText, BookOpen, User, Folder, Layers } from 'lucide-react';

const fallbackIcons = {
  section: FileText,
  course: BookOpen,
  chapter: FileText,
  user: User,
  folder: Folder,
  layers: Layers,
  default: FileText
};

export default function ImageWithFallback({ 
  src, 
  alt, 
  type = "default",
  size = "full",
  iconSize = "default",
  className = "",
  containerClassName = ""
}) {
  const Icon = fallbackIcons[type] || fallbackIcons.default;
  
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16", 
    lg: "w-24 h-24",
    full: "w-full h-full"
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    default: size === "full" ? "w-12 h-12" : "w-5 h-5"
  };
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} object-cover ${className}`}
      />
    );
  }
  
  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${containerClassName}`}>
      <Icon className={`${iconSizes[iconSize]} text-bg`} />
    </div>
  );
}