// frontend/src/components/course/sections/detail/SectionChaptersPreview.jsx
import { FileText, Plus, Edit } from 'lucide-react';
import ChapterPreviewCard from '../cards/ChapterPreviewCard';
import StatsGrid from '../../../common/StatsGrid';
import ListHeader from '../../../common/ListHeader';

export default function SectionChaptersPreview({ section, onEditClick }) {
  const sectionData = section.sections || section;
  const chapters = sectionData.chapters || [];

  const actions = (
    <button
      onClick={onEditClick}
      className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
    >
      <Edit className="w-4 h-4" />
      Edit
    </button>
  );

  return (
    <div className="bg-bg rounded-lg shadow-lg p-6">
      <ListHeader
        title="Chapters"
        count={chapters.length}
        icon={FileText}
        actions={actions}
      />

      {chapters.length > 0 ? (
        <>
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <ChapterPreviewCard
                key={(chapter.chapters || chapter).chapterId}
                chapter={chapter}
                showContent={true}
              />
            ))}
          </div>

          {/* Quick stats */}
          <div className="mt-6 pt-4 border-t border-border-primary">
            <StatsGrid
              stats={[
                { value: chapters.length, label: "Total Chapters" },
                { value: chapters.filter(c => (c.chapters || c).content).length, label: "With Content" },
                { value: chapters.filter(c => c.videos).length, label: "With Videos" },
                { value: chapters.filter(c => c.images).length, label: "With Images" }
              ]}
            />
          </div>
        </>
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
    </div>
  );
}