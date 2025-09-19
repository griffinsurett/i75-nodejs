import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import ActiveArchivedTabs from '../../archive/ActiveArchivedTabs';
import ArchivedNotice from '../../archive/ArchivedNotice';
import SectionCard from './SectionCard';

export default function CourseSections({ courseId, sections, onRefresh }) {
  const navigate = useNavigate();
  const [view, setView] = useState('active');

  const handleAddSection = () => {
    // Navigate to section create page with courseId as a query parameter
    navigate(`/sections/new?courseId=${courseId}`);
  };

  // Filter sections based on view
  const activeSections = sections.filter(s => !(s.sections || s).isArchived);
  const archivedSections = sections.filter(s => (s.sections || s).isArchived);
  const displayedSections = view === 'archived' ? archivedSections : activeSections;
  const sectionCount = view === 'archived' ? archivedSections.length : activeSections.length;

  return (
    <div className="bg-bg rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-heading flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Course Sections ({sectionCount})
          </h2>
          <ActiveArchivedTabs 
            value={view} 
            onChange={setView} 
            className="ml-2"
            activeLabel="Active"
            archivedLabel="Archived"
          />
        </div>
        
        <button
          onClick={handleAddSection}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {view === 'archived' && displayedSections.length > 0 && <ArchivedNotice />}

      {displayedSections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedSections.map((section) => (
            <SectionCard
              key={(section.sections || section).sectionId}
              section={section}
              courseId={courseId}
              onChanged={onRefresh}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-text/70 mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">
            {view === 'archived' ? 'No archived sections' : 'No sections yet'}
          </h3>
          <p className="text-text mb-4">
            {view === 'archived' 
              ? 'Archived sections you hide will appear here.'
              : 'Create your first section to organize your course content.'}
          </p>
          {view === 'active' && (
            <button
              onClick={handleAddSection}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Section
            </button>
          )}
        </div>
      )}
    </div>
  );
}