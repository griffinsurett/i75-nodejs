// frontend/src/components/course/sections/lists/CourseSections.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import ActiveArchivedTabs from '../../../archive/ActiveArchivedTabs';
import ArchivedNotice from '../../../archive/ArchivedNotice';
import SectionCard from '../cards/SectionCard';
import ListHeader from '../../../common/ListHeader';
import EmptyState from '../../../common/EmptyState';

export default function CourseSections({ courseId, sections, onRefresh }) {
  const navigate = useNavigate();
  const [view, setView] = useState('active');

  const handleAddSection = () => {
    navigate(`/sections/new?courseId=${courseId}`);
  };

  // Filter sections based on view
  const activeSections = sections.filter(s => !(s.sections || s).isArchived);
  const archivedSections = sections.filter(s => (s.sections || s).isArchived);
  const displayedSections = view === 'archived' ? archivedSections : activeSections;
  const sectionCount = view === 'archived' ? archivedSections.length : activeSections.length;

  const tabs = (
    <ActiveArchivedTabs 
      value={view} 
      onChange={setView} 
      className="ml-2"
      activeLabel="Active"
      archivedLabel="Archived"
    />
  );

  const actions = (
    <button
      onClick={handleAddSection}
      className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
    >
      <Plus className="w-4 h-4" />
      Add Section
    </button>
  );

  return (
    <div className="bg-bg rounded-lg shadow-lg p-6">
      <ListHeader
        title="Course Sections"
        count={sectionCount}
        icon={FileText}
        tabs={tabs}
        actions={actions}
      />

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
        <EmptyState
          icon={FileText}
          title={view === 'archived' ? 'No archived sections' : 'No sections yet'}
          description={
            view === 'archived' 
              ? 'Archived sections you hide will appear here.'
              : 'Create your first section to organize your course content.'
          }
          action={
            view === 'active' && (
              <button
                onClick={handleAddSection}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Section
              </button>
            )
          }
        />
      )}
    </div>
  );
}