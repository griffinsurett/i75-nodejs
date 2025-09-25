// frontend/src/components/common/EntityHeader.jsx
import ArchiveBadge from '../archive/ArchiveBadge';
import ImageWithFallback from './ImageWithFallback';
import DateDisplay from './DateDisplay';
import MediaIndicator from './MediaIndicator';

export default function EntityHeader({ 
  title,
  description,
  image,
  video,
  breadcrumb,
  dates = [],
  isArchived,
  archivedAt,
  scheduledDeleteAt,
  additionalInfo,
  imageType = "default",
  gradientColors = "from-blue-500 to-purple-600"
}) {
  return (
    <div className="bg-bg rounded-lg shadow-lg overflow-hidden mb-8">
      <div className="md:flex">
        {/* Image Section */}
        <div className="md:w-1/3 relative">
          <div className={`h-64 md:h-full bg-gradient-to-r ${gradientColors}`}>
            <ImageWithFallback 
              src={image?.imageUrl}
              alt={image?.altText || title}
              type={imageType}
              size="full"
              iconSize="xl"
            />
          </div>
          
          {isArchived && (
            <span className="absolute top-2 left-2">
              <ArchiveBadge
                archivedAt={archivedAt}
                scheduledDeleteAt={scheduledDeleteAt}
              />
            </span>
          )}
        </div>

        {/* Info Section */}
        <div className="md:w-2/3 p-6">
          {breadcrumb && (
            <div className="flex items-center gap-2 text-sm text-primary mb-2">
              {breadcrumb}
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-heading mb-4">{title}</h1>
          <p className="text-text/70 text-lg mb-6">
            {description || "No description available"}
          </p>
          
          {/* Dates and Media */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {dates.map((dateProps, idx) => (
              <DateDisplay key={idx} {...dateProps} />
            ))}
            {video?.title && (
              <MediaIndicator type="video" title={`Course Video: ${video.title}`} />
            )}
          </div>
          
          {/* Additional content slot */}
          {additionalInfo}
        </div>
      </div>
    </div>
  );
}