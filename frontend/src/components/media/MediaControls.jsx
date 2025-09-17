import { Search, Grid3x3, List, Image as ImageIcon, Film } from 'lucide-react';

export default function MediaControls({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  imageCount,
  videoCount
}) {
  const totalCount = imageCount + videoCount;

  return (
    <div className="bg-bg rounded-lg shadow-sm p-4 mb-6">
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

        {/* Search and View Mode */}
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/50" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3 py-2 bg-bg2 border border-border-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex gap-1 bg-bg2 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-bg text-primary' : 'text-text/70 hover:text-text'}`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-bg text-primary' : 'text-text/70 hover:text-text'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}