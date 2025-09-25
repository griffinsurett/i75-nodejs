// frontend/src/components/chapter/ChapterPreviewCard.jsx
import MediaIndicator from '../../../common/MediaIndicator';
import ContentPreview from '../../../common/ContentPreview';

export default function ChapterPreviewCard({ chapter, showContent = true }) {
  const chapterData = chapter.chapters || chapter;
  const video = chapter.videos;
  const image = chapter.images;
  
  return (
    <div className="border border-border-primary rounded-lg p-4 hover:shadow-md transition-shadow">
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
          {(video || image) && (
            <div className="flex items-center gap-4 ml-11">
              {video && <MediaIndicator type="video" title={`Video: ${video.title}`} />}
              {image && <MediaIndicator type="image" title="Image attached" />}
            </div>
          )}

          {/* Content preview */}
          {showContent && chapterData.content && (
            <ContentPreview content={chapterData.content} className="mt-3 ml-11" />
          )}
        </div>
      </div>
    </div>
  );
}