// frontend/src/components/course/sections/SectionChaptersPreview.jsx
import { FileText, Play, Edit, Plus } from 'lucide-react';

export default function SectionChaptersPreview({ section, onEditClick }) {
  const sectionData = section.sections || section;
  const chapters = sectionData.chapters || [];

  return (
    <div className="bg-bg rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-heading flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          Chapters ({chapters.length})
        </h2>
        
        <button
          onClick={onEditClick}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      {chapters.length > 0 ? (
        <div className="space-y-4">
          {chapters.map((chapter) => {
            const chapterData = chapter.chapters || chapter;
            const chapterVideo = chapter.videos;
            const chapterImage = chapter.images;
            
            return (
              <div
                key={chapterData.chapterId}
                className="border border-border-primary rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                        {chapterData.chapterNumber}
                      </div>
                      <h3 className="font-semibold text-lg text-heading">
                        {chapterData.title}
                      </h3>
                    </div>

                    {chapterData.description && (
                      <p className="text-text text-sm mb-3 ml-11">
                        {chapterData.description}
                      </p>
                    )}

                    {/* Media indicators */}
                    <div className="flex items-center gap-4 ml-11">
                      {chapterVideo?.title && (
                        <div className="flex items-center text-sm text-text/70">
                          <Play className="w-4 h-4 mr-1" />
                          <span>Video: {chapterVideo.title}</span>
                        </div>
                      )}
                      
                      {chapterImage?.altText && (
                        <div className="flex items-center text-sm text-text/70">
                          <FileText className="w-4 h-4 mr-1" />
                          <span>Image attached</span>
                        </div>
                      )}
                    </div>

                    {/* Content preview */}
                    {chapterData.content && (
                      <div className="mt-3 ml-11">
                        <div className="text-xs text-text/60 mb-1">Content Preview:</div>
                        <div className="text-sm text-text bg-bg2 p-3 rounded border-l-2 border-primary/20">
                          {chapterData.content.length > 200 
                            ? `${chapterData.content.substring(0, 200)}...` 
                            : chapterData.content
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-text/70 mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">No chapters yet</h3>
          <p className="text-text mb-4">
            This section doesn't have any chapters. Add chapters to organize your content.
          </p>
          <button
            onClick={onEditClick}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Chapter
          </button>
        </div>
      )}

      {/* Quick stats */}
      {chapters.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border-primary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{chapters.length}</div>
              <div className="text-xs text-text/60">Total Chapters</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {chapters.filter(c => (c.chapters || c).content).length}
              </div>
              <div className="text-xs text-text/60">With Content</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {chapters.filter(c => c.videos).length}
              </div>
              <div className="text-xs text-text/60">With Videos</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {chapters.filter(c => c.images).length}
              </div>
              <div className="text-xs text-text/60">With Images</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}