import { FileText, Calendar, Play, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import ArchiveBadge from '../../archive/ArchiveBadge';
import { formatDate } from '../../../utils/formatDate';

export default function SectionHeader({ section }) {
  const sectionData = section.sections || section;
  const courseData = section.courses || {};
  const imageData = section.images;
  const videoData = section.videos;

  return (
    <div className="bg-bg rounded-lg shadow-lg overflow-hidden mb-8">
      <div className="md:flex">
        {/* Section Image */}
        <div className="md:w-1/3 relative">
          <div className="h-64 md:h-full bg-gradient-to-r from-green-500 to-teal-600">
            {imageData?.imageUrl ? (
              <img
                src={imageData.imageUrl}
                alt={imageData.altText || sectionData.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <FileText className="w-16 h-16 text-text" />
              </div>
            )}
          </div>

          {sectionData.isArchived && (
            <span className="absolute top-2 left-2">
              <ArchiveBadge
                archivedAt={sectionData.archivedAt}
                scheduledDeleteAt={sectionData.purgeAfterAt}
              />
            </span>
          )}
        </div>

        {/* Section Info */}
        <div className="md:w-2/3 p-6">
          <div className="flex items-center gap-2 text-sm text-primary mb-2">
            <Layers className="w-4 h-4" />
            <Link
              to={`/courses/${sectionData.courseId}`}
              className="hover:underline"
            >
              {courseData.courseName}
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-heading mb-4">
            {sectionData.title}
          </h1>

          <p className="text-text/70 text-lg mb-6">
            {sectionData.description || 'No description available'}
          </p>

          {/* Section Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-text/70">
              <Calendar className="w-5 h-5 mr-2" />
              <div>
                <div className="font-medium">Created</div>
                <div className="text-sm">{formatDate(sectionData.createdAt)}</div>
              </div>
            </div>

            {sectionData.updatedAt && (
              <div className="flex items-center text-text/70">
                <Calendar className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-sm">{formatDate(sectionData.updatedAt)}</div>
                </div>
              </div>
            )}

            {videoData?.title && (
              <div className="flex items-center text-text/70">
                <Play className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-medium">Section Video</div>
                  <div className="text-sm">{videoData.title}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}