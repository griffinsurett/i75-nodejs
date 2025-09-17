// frontend/src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Users,
  FileText,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Logo from "../assets/i75logo.webp";
import { courseAPI } from "../services/api";
import CurrentUser from "./CurrentUser";

const Sidebar = ({ isOpen, onToggle, isMobile }) => {
  const location = useLocation();

  // nav items
  const nav = [
    { name: "Dashboard", href: "/", icon: BarChart3, current: location.pathname === "/" },
    { name: "Courses", href: "/courses", icon: BookOpen, current: location.pathname.startsWith("/courses") },
    { name: "Instructors", href: "/instructors", icon: Users, current: location.pathname === "/instructors" },
    { name: "Media Library", href: "/media-library", icon: FileText, current: location.pathname === "/media-library" },
  ];

  // dynamic courses submenu
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);
  const [coursesOpen, setCoursesOpen] = useState(location.pathname.startsWith("/courses"));

  useEffect(() => {
    setCoursesLoading(true);
    courseAPI
      .getAllCourses()
      .then((res) => {
        if (res.data?.success) {
          const courseList = res.data.data.map(item => {
            // Handle both nested and flat structure
            const courseData = item.courses || item;
            return {
              courseId: courseData.courseId,
              courseName: courseData.courseName
            };
          });
          setCourses(courseList);
        } else {
          setCoursesError("Failed to load courses");
        }
      })
      .catch((e) => setCoursesError(e?.response?.data?.message || "Failed to load courses"))
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/courses")) setCoursesOpen(true);
  }, [location.pathname]);

  const isCourseActive = (id) =>
    location.pathname === `/courses/${id}` || location.pathname.startsWith(`/courses/${id}/`);

  // Calculate width based on state
  const sidebarWidth = isOpen ? '256px' : '64px';

  return (
    <aside 
      className="fixed inset-y-0 left-0 z-40 bg-bg border-r border-border-primary shadow-lg transition-all duration-300"
      style={{ width: sidebarWidth }}
    >
      <div className="flex flex-col h-full">
        {/* Header / Logo + collapse button */}
        <div className="px-3 py-4 flex-shrink-0">
          <div className={`flex items-center ${isOpen ? "justify-between" : "justify-center"} gap-2`}>
            <Link to="/" className="rounded-xl flex items-center justify-center flex-shrink-0">
              <img src={Logo} alt="I75 Logo" className={`${isOpen ? "w-10 h-10" : "w-8 h-8"} transition-all`} />
            </Link>
            {isOpen && (
              <div className="min-w-0 transition-opacity duration-300">
                <h1 className="text-lg font-bold text-heading leading-tight">I75 Platform</h1>
                <p className="text-xs text-text">Education Management</p>
              </div>
            )}
            <button
              type="button"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-bg2 transition-colors flex-shrink-0"
              title={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? <PanelLeftClose className="w-4 h-4 text-text" /> : <PanelLeftOpen className="w-4 h-4 text-text" />}
            </button>
          </div>
        </div>

        {/* Nav (scrollable) */}
        <div className="px-3 flex-1 overflow-y-auto">
          {isOpen && (
            <h2 className="text-xs font-semibold text-text uppercase tracking-wider mb-3 transition-opacity duration-300">Navigation</h2>
          )}

          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;

              // non-courses
              if (item.name !== "Courses") {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    title={!isOpen ? item.name : undefined}
                    className={`
                      flex items-center group
                      ${isOpen ? "justify-start px-3" : "justify-center px-0"}
                      py-2.5 text-sm font-medium rounded-lg transition-all duration-300
                      ${item.current ? "bg-primary/10 text-primary" : "text-text hover:text-heading hover:bg-bg2"}
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${item.current ? "text-primary" : "text-text group-hover:text-heading"}`}
                    />
                    {isOpen && (
                      <span className="ml-3 truncate transition-opacity duration-300">{item.name}</span>
                    )}
                  </Link>
                );
              }

              // Courses + submenu
              return (
                <div key="Courses" className="space-y-1">
                  <div
                    className={`
                      flex items-center group
                      ${isOpen ? "px-3" : "px-0 justify-center"}
                      py-2.5 text-sm font-medium rounded-lg transition-all duration-300
                      ${item.current ? "bg-primary/10 text-primary" : "text-text hover:text-heading hover:bg-bg2"}
                    `}
                    title={!isOpen ? "Courses" : undefined}
                  >
                    <Link 
                      to={item.href} 
                      className={`flex items-center gap-3 ${isOpen ? "flex-1" : ""}`}
                    >
                      <Icon className={`${item.current ? "text-primary" : "text-text"} w-5 h-5 flex-shrink-0`} />
                      {isOpen && <span className="transition-opacity duration-300">Courses</span>}
                    </Link>

                    {isOpen && (
                      <button
                        type="button"
                        aria-label="Toggle courses submenu"
                        aria-expanded={coursesOpen}
                        onClick={() => setCoursesOpen((v) => !v)}
                        className="p-1 rounded hover:bg-bg2 transition-opacity duration-300"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${coursesOpen ? "rotate-180" : ""} ${
                            item.current ? "text-primary" : "text-text"
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Submenu only when expanded sidebar */}
                  {isOpen && coursesOpen && (
                    <div className="ml-8 pr-1 transition-opacity duration-300">
                      {coursesLoading && <div className="px-3 py-2 text-xs text-text/70">Loading…</div>}
                      {coursesError && <div className="px-3 py-2 text-xs text-red-600">{coursesError}</div>}
                      {!coursesLoading && !coursesError && courses.length === 0 && (
                        <div className="px-3 py-2 text-xs text-text/70">No courses yet</div>
                      )}
                      {!coursesLoading &&
                        !coursesError &&
                        courses.map((c) => (
                          <Link
                            key={c.courseId}
                            to={`/courses/${c.courseId}`}
                            title={c.courseName}
                            className={`
                              block px-3 py-2 text-sm rounded-md truncate transition-colors
                              ${
                                isCourseActive(c.courseId)
                                  ? "bg-primary/10 text-primary"
                                  : "text-text hover:text-heading hover:bg-bg2"
                              }
                            `}
                          >
                            {c.courseName}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border-primary flex-shrink-0">
          <CurrentUser compact={!isOpen} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;