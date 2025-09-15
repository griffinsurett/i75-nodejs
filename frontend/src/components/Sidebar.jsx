// frontend/src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Logo from "../assets/i75logo.webp";
import { courseAPI } from "../services/api";
import CurrentUser from "./CurrentUser";

// simple media query hook
function useMediaQuery(query) {
  const get = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : true;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    setMatches(mq.matches);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [query]);
  return matches;
}

const Sidebar = ({
  widthClass = "w-64",         // visual width class (open state)
  openWidth = "16rem",        // CSS var value when open (matches w-64)
  closedWidth = "4rem",       // CSS var value when closed (matches w-16)
}) => {
  const location = useLocation();

  // Responsive behavior like ChatGPT: open on desktop, closed on small screens
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [open, setOpen] = useState(isDesktop);
  useEffect(() => setOpen(isDesktop), [isDesktop]);

  // Keep a CSS variable in sync so the page offsets itself correctly
  useEffect(() => {
    const val = open ? openWidth : closedWidth;
    document.documentElement.style.setProperty("--sidebar-w", val);
  }, [open, openWidth, closedWidth]);

  // nav items
  const nav = [
    { name: "Dashboard", href: "/", icon: BarChart3, current: location.pathname === "/" },
    { name: "Courses", href: "/courses", icon: BookOpen, current: location.pathname.startsWith("/courses") },
    { name: "Instructors", href: "/instructors", icon: Users, current: location.pathname === "/instructors" },
    { name: "Content Library", href: "/content", icon: FileText, current: location.pathname === "/content" },
    { name: "Assessments", href: "/assessments", icon: ClipboardList, current: location.pathname === "/assessments" },
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
        if (res.data?.success) setCourses(res.data.data || []);
        else setCoursesError("Failed to load courses");
      })
      .catch((e) => setCoursesError(e?.response?.data?.message || "Failed to load courses"))
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/courses")) setCoursesOpen(true);
  }, [location.pathname]);

  const isCourseActive = (id) =>
    location.pathname === `/courses/${id}` || location.pathname.startsWith(`/courses/${id}/`);

  return (
    <div
      className={`
        fixed inset-y-0 left-0 bg-bg shadow-sm border-r border-border-primary
        transition-[width] duration-300 ease-in-out
        ${open ? widthClass : "w-16"}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header / Logo + collapse button */}
        <div className="px-3 py-4">
          <div className={`flex items-center ${open ? "justify-between" : "justify-center"} gap-2`}>
            <a href="/" className="rounded-xl flex items-center justify-center">
              <img src={Logo} alt="I75 Logo" className={`${open ? "w-10 h-10" : "w-8 h-8"}`} />
            </a>
            {open && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-heading leading-tight">I75 Platform</h1>
                <p className="text-xs text-text">Education Management</p>
              </div>
            )}
            <button
              type="button"
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              onClick={() => setOpen((v) => !v)}
              className={`p-2 rounded-lg hover:bg-bg2 ${open ? "" : "mt-0"}`}
              title={open ? "Collapse" : "Expand"}
            >
              {open ? <PanelLeftClose className="w-4 h-4 text-text" /> : <PanelLeftOpen className="w-4 h-4 text-text" />}
            </button>
          </div>
        </div>

        {/* Nav (scrollable) */}
        <div className="px-3 flex-1 overflow-y-auto">
          {open && (
            <h2 className="text-xs font-semibold text-text uppercase tracking-wider mb-3">Navigation</h2>
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
                    title={!open ? item.name : undefined}
                    className={`
                      flex items-center ${open ? "justify-start px-3" : "justify-center px-0"}
                      py-2.5 text-sm font-medium rounded-lg transition-colors group
                      ${item.current ? "bg-primary/10 text-primary" : "text-text hover:text-heading hover:bg-bg2"}
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 ${item.current ? "text-primary" : "text-text group-hover:text-heading"}`}
                    />
                    {open && <span className="ml-3 truncate">{item.name}</span>}
                  </Link>
                );
              }

              // Courses + submenu
              return (
                <div key="Courses" className="space-y-1">
                  <div
                    className={`
                      flex items-center ${open ? "px-3" : "px-0 justify-center"}
                      py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${item.current ? "bg-primary/10 text-primary" : "text-text hover:text-heading hover:bg-bg2"}
                    `}
                    title={!open ? "Courses" : undefined}
                  >
                    <Link to={item.href} className={`flex items-center gap-3 ${open ? "flex-1" : ""}`}>
                      <Icon className={`${item.current ? "text-primary" : "text-text"} w-5 h-5`} />
                      {open && <span>Courses</span>}
                    </Link>

                    {open && (
                      <button
                        type="button"
                        aria-label="Toggle courses submenu"
                        aria-expanded={coursesOpen}
                        onClick={() => setCoursesOpen((v) => !v)}
                        className="p-1 rounded hover:bg-bg2"
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
                  {open && (
                    <div className={`ml-8 pr-1 ${coursesOpen ? "block" : "hidden"}`}>
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
                              ${
                                isCourseActive(c.course_id)
                                  ? "bg-primary/10 text-primary"
                                  : "text-text hover:text-heading hover:bg-bg2"
                              }
                            `}
                          >
                            {c.course_name}
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
        <div className="p-2 border-t border-border-primary">
          {/* When collapsed, show only avatar; when expanded, show full row */}
          <CurrentUser compact={!open} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
