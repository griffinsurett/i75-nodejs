import { Link } from "react-router-dom";
import { FileText, Calendar, Play } from "lucide-react";
import EditActions from "../../archive/EditActions";
import ArchiveBadge from "../../archive/ArchiveBadge";
import { formatDate } from "../../../utils/formatDate";
import { sectionAPI } from "../../../services/api";

export default function SectionCard({ section, courseId, onChanged, onEdit }) {
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
            editTo={`/sections/${sectionData.sectionId}/edit`} // Change from onEdit to editTo
            entityName="section"
            api={{
              archive: sectionAPI.archiveSection,
              restore: sectionAPI.restoreSection,
              delete: sectionAPI.deleteSection,
            }}
            onChanged={onChanged}
          />
        </div>

        {imageData?.imageUrl ? (
          <img
            src={imageData.imageUrl}
            alt={imageData.altText || sectionData.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FileText className="w-12 h-12 text-bg" />
          </div>
        )}

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
            <div className="flex items-center text-sm text-text">
              <Play className="w-4 h-4 mr-2" />
              <span>Video: {videoData.title}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-text">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              Created: {formatDate(sectionData.createdAt, { variant: "short" })}
            </span>
          </div>
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
