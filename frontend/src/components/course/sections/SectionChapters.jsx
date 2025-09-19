import { FileText, Plus } from 'lucide-react';

export default function SectionChapters({ section }) {
  const sectionData = section.sections || section;
  const chapters = sectionData.chapters || [];

  return (
    <div className="bg-bg rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-heading">
          Chapters {chapters.length > 0 && `(${chapters.length})`}
        </h2>
        <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Chapter
        </button>
      </div>

      {chapters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chapters.map((chapter) => {
            const chapterData = chapter.chapters || chapter;
            return (
              <div key={chapterData.chapterId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-heading mb-2">
                  Chapter {chapterData.chapterNumber}: {chapterData.title}
                </h3>
                <p className="text-text text-sm">
                  {chapterData.description || 'No description available'}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-text/70 mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">No chapters available</h3>
          <p className="text-text mb-4">This section doesn't have any chapters yet.</p>
          <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Create First Chapter
          </button>
        </div>
      )}
    </div>
  );
}