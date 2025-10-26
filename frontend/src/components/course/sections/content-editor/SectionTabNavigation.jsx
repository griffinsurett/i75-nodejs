// frontend/src/components/course/sections/content-editor/SectionTabNavigation.jsx
import { Settings, BookOpen } from 'lucide-react';

export default function SectionTabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: 'curriculum',
      label: 'Curriculum',
      icon: BookOpen,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="bg-bg border-b border-border-primary">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-medium
                border-b-2 transition-colors
                ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text hover:text-heading hover:bg-bg2'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}