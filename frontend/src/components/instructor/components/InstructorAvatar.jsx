// frontend/src/components/instructor/components/InstructorAvatar.jsx
import { User } from 'lucide-react';

export default function InstructorAvatar({ 
  imageUrl, 
  altText, 
  name, 
  size = 'medium',
  showBorder = false,
  className = '' 
}) {
  const sizes = {
    small: { container: 'w-16 h-16', icon: 'w-8 h-8' },
    medium: { container: 'w-32 h-32', icon: 'w-16 h-16' },
    large: { container: 'w-40 h-40', icon: 'w-20 h-20' }
  };

  const sizeConfig = sizes[size] || sizes.medium;
  const borderClass = showBorder ? 'border-4 border-white shadow-lg' : '';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={altText || name}
        className={`${sizeConfig.container} rounded-full object-cover ${borderClass} ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeConfig.container} rounded-full bg-white/20 backdrop-blur flex items-center justify-center ${borderClass} ${className}`}>
      <User className={`${sizeConfig.icon} text-white`} />
    </div>
  );
}