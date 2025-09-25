// frontend/src/components/media/MediaControls.jsx
import { Grid3x3, List, Image as ImageIcon, Film } from 'lucide-react';

export default function MediaControls({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  imageCount,
  videoCount,
  className = '',
}) {
  const totalCount = imageCount + videoCount;

  return (
    <div className={`bg-bg rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-bg2 text-text hover:bg-bg3'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'images' 
                ? 'bg-primary text-white' 
                : 'bg-bg2 text-text hover:bg-bg3'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Images ({imageCount})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'videos' 
                ? 'bg-primary text-white' 
                : 'bg-bg2 text-text hover:bg-bg3'
            }`}
          >
            <Film className="w-4 h-4" />
            Videos ({videoCount})
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-bg2 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid' 
                ? 'bg-bg text-primary' 
                : 'text-text/70 hover:text-text'
            }`}
            title="Grid view"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list' 
                ? 'bg-bg text-primary' 
                : 'text-text/70 hover:text-text'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}