// frontend/src/components/instructor/components/InstructorAvatar.jsx
import ImageWithFallback from '../../common/ImageWithFallback';

export default function InstructorAvatar({ 
  imageUrl, 
  altText, 
  name, 
  size = 'medium',
  showBorder = false,
  className = '' 
}) {
  const containerSizes = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-40 h-40'
  };

  const borderClass = showBorder ? 'border-4 border-white shadow-lg' : '';

  return (
    <div className={`${containerSizes[size]} rounded-full ${borderClass} ${className} overflow-hidden`}>
      <ImageWithFallback
        src={imageUrl}
        alt={altText || name}
        type="user"
        size="full"
        iconSize={size === 'large' ? 'xl' : size === 'medium' ? 'lg' : 'md'}
        className="rounded-full"
        containerClassName="bg-white/20 backdrop-blur"
      />
    </div>
  );
}