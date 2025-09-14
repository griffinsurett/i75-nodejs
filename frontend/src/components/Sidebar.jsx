import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Logo from '../assets/i75logo.webp';
import { courseAPI } from '../services/api';

const Sidebar = ({ widthClass = 'w-64' }) => {
  const location = useLocation();

  // nav items
  const nav = [
    { name: 'Dashboard', href: '/', icon: BarChart3, current: location.pathname === '/' },
    { name: 'Courses', href: '/courses', icon: BookOpen, current: location.pathname.startsWith('/courses') },
    { name: 'Instructors', href: '/instructors', icon: Users, current: location.pathname === '/instructors' },
    { name: 'Content Library', href: '/content', icon: FileText, current: location.pathname === '/content' },
    { name: 'Assessments', href: '/assessments', icon: ClipboardList, current: location.pathname === '/assessments' },
  ];

  // dynamic courses submenu
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);
  const [coursesOpen, setCoursesOpen] = useState(location.pathname.startsWith('/courses'));

  useEffect(() => {
    setCoursesLoading(true);
    courseAPI
      .getAllCourses()
      .then((res) => {
        if (res.data?.success) setCourses(res.data.data || []);
        else setCoursesError('Failed to load courses');
      })
      .catch((e) => setCoursesError(e?.response?.data?.message || 'Failed to load courses'))
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/courses')) setCoursesOpen(true);
  }, [location.pathname]);

  const isCourseActive = (id) =>
    location.pathname === `/courses/${id}` ||
    location.pathname.startsWith(`/courses/${id}/`);

  return (
    <div className={`fixed inset-y-0 left-0 ${widthClass} bg-bg shadow-sm border-r border-border-primary`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-8">
          <div className="flex items-start space-x-3">
            <a href="/" className="rounded-xl flex items-center justify-center">
              <img src={Logo} alt="I75 Logo" className="w-12 h-12" />
            </a>
            <div>
              <h1 className="text-xl font-bold text-heading">I75 Platform</h1>
              <p className="text-sm text-text mt-0.5">Education Management</p>
            </div>
          </div>
        </div>

        {/* Nav (scrollable) */}
        <div className="px-6 flex-1 overflow-y-auto">
          <h2 className="text-xs font-semibold text-text uppercase tracking-wider mb-4">Navigation</h2>

          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;

              if (item.name !== 'Courses') {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group
                      ${item.current ? 'bg-primary/10 text-primary' : 'text-text hover:text-heading hover:bg-bg2'}
                    `}
                  >
                    <Icon
                      className={`mr-3 w-5 h-5 ${item.current ? 'text-primary' : 'text-text group-hover:text-heading'}`}
                    />
                    {item.name}
                  </Link>
                );
              }

              // Courses + submenu
              return (
                <div key="Courses" className="space-y-1">
                  <div
                    className={`
                      flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${item.current ? 'bg-primary/10 text-primary' : 'text-text hover:text-heading hover:bg-bg2'}
                    `}
                  >
                    <Link to={item.href} className="flex items-center gap-3 flex-1">
                      <Icon className={`${item.current ? 'text-primary' : 'text-text'} w-5 h-5`} />
                      Courses
                    </Link>

                    <button
                      type="button"
                      aria-label="Toggle courses submenu"
                      aria-expanded={coursesOpen}
                      onClick={() => setCoursesOpen((v) => !v)}
                      className="p-1 rounded hover:bg-bg2"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${coursesOpen ? 'rotate-180' : ''} ${
                          item.current ? 'text-primary' : 'text-text'
                        }`}
                      />
                    </button>
                  </div>

                  <div className={`ml-8 pr-1 ${coursesOpen ? 'block' : 'hidden'}`}>
                    {coursesLoading && <div className="px-3 py-2 text-xs text-text/70">Loading…</div>}
                    {coursesError && <div className="px-3 py-2 text-xs text-red-600">{coursesError}</div>}
                    {!coursesLoading && !coursesError && courses.length === 0 && (
                      <div className="px-3 py-2 text-xs text-text/70">No courses yet</div>
                    )}
                    {!coursesLoading &&
                      !coursesError &&
                      courses.map((c) => (
                        <Link
                          key={c.course_id}
                          to={`/courses/${c.course_id}`}
                          title={c.course_name}
                          className={`
                            block px-3 py-2 text-sm rounded-md truncate transition-colors
                            ${isCourseActive(c.course_id) ? 'bg-primary/10 text-primary' : 'text-text hover:text-heading hover:bg-bg2'}
                          `}
                        >
                          {c.course_name}
                        </Link>
                      ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-border-primary">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-text uppercase tracking-wider">Appearance</span>
            <ThemeToggle />
          </div>
         
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
