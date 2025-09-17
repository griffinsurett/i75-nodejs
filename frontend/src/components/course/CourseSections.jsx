import { Link } from 'react-router-dom';
import { FileText, Play } from 'lucide-react';

export default function CourseSections({ sections }) {
  return (
    <div className="bg-bg rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-heading mb-6 flex items-center">
        <FileText className="w-6 h-6 mr-2" />
        Course Sections ({sections.length})
      </h2>

      {sections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const sectionData = section.sections || section;
            const sectionVideo = section.videos;
            
            return (
              <div key={sectionData.sectionId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-heading mb-2">
                  {sectionData.title}
                </h3>

                <p className="text-text text-sm mb-4 line-clamp-3">
                  {sectionData.description || 'No description available'}
                </p>

                {sectionVideo?.title && (
                  <div className="flex items-center text-sm text-text/70 mb-3">
                    <Play className="w-4 h-4 mr-1" />
                    <span>{sectionVideo.title}</span>
                  </div>
                )}

                <Link
                  to={`/sections/${sectionData.sectionId}/chapters`}
                  className="inline-block bg-primary hover:bg-primary/50 text-text px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  View Chapters
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-text/70 mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">No sections available</h3>
          <p className="text-text">This course doesn't have any sections yet.</p>
        </div>
      )}
    </div>
  );
}