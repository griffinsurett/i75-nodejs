// frontend/src/components/course/sections/cards/SectionCard.jsx
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import EditActions from "../../../archive/EditActions";
import ArchiveBadge from "../../../archive/ArchiveBadge";
import ImageWithFallback from "../../../common/ImageWithFallback";
import DateDisplay from "../../../common/DateDisplay";
import MediaIndicator from "../../../common/MediaIndicator";
import { sectionAPI } from "../../../../services/api";

export default function SectionCard({ section, courseId, onChanged }) {
  const sectionData = section.sections || section;
  const imageData = section.images;
  const videoData = section.videos;

  return (
    <div className="bg-bg rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="h-48 bg-gradient-to-r from-green-500 to-teal-600 relative">
        {/* Actions */}
        <div className="absolute top-2 right-2 z-10">
          <EditActions
            id={sectionData.sectionId}
            isArchived={sectionData.isArchived}
            editTo={`/sections/${sectionData.sectionId}/edit`}
            entityName="section"
            api={{
              archive: sectionAPI.archiveSection,
              restore: sectionAPI.restoreSection,
              delete: sectionAPI.deleteSection,
            }}
            onChanged={onChanged}
          />
        </div>

        <ImageWithFallback
          src={imageData?.imageUrl}
          alt={imageData?.altText || sectionData.title}
          type="section"
          size="full"
          iconSize="lg"
        />

        {sectionData.isArchived && (
          <span className="absolute bottom-2 left-2">
            <ArchiveBadge
              archivedAt={sectionData.archivedAt}
              scheduledDeleteAt={sectionData.purgeAfterAt}
            />
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-heading mb-2 line-clamp-2">
          {sectionData.title}
        </h3>

        <p className="text-text mb-4 line-clamp-3">
          {sectionData.description || "No description available"}
        </p>

        <div className="space-y-2 mb-4">
          {videoData?.title && (
            <MediaIndicator type="video" title={`Video: ${videoData.title}`} />
          )}
          <DateDisplay
            label="Created"
            date={sectionData.createdAt}
            variant="compact"
          />
        </div>

        <Link
          to={`/courses/${courseId}/sections/${sectionData.sectionId}`}
          className="block w-full bg-primary hover:bg-primary/65 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors text-center"
        >
          View Section Details
        </Link>
      </div>
    </div>
  );
}