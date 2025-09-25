import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import CourseUpsertPage from "./pages/CourseUpsertPage";
// Pages
import HomePage from "./pages/HomePage";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFoundPage from "./pages/NotFoundPage";
import MediaLibrary from "./pages/MediaLibrary";
import Instructors from "./pages/Instructors";
import InstructorDetail from "./components/instructor/views/InstructorDetail";
import InstructorUpsertPage from "./pages/InstructorUpsertPage";
import Sections from "./pages/Sections";
import SectionDetail from "./components/course/sections/detail/SectionDetail";
import SectionUpsertPage from "./pages/SectionUpsertPage";
import SectionEditPage from "./pages/SectionEditPage";

// Components
import CourseList from "./components/course/views/CourseList";
import CourseDetail from "./components/course/views/CourseDetail";
import Sidebar from "./components/layout/Sidebar";
import ThemeToggle from "./components/theme/ThemeToggle";

function AppContent() {
  const { sidebarOpen, toggleSidebar, isMobile } = useSidebar();

  // Content margin calculation
  const contentStyle = {
    marginLeft: isMobile ? "64px" : sidebarOpen ? "256px" : "64px",
    transition: "margin-left 300ms ease-in-out",
  };

  return (
    <div className="min-h-screen bg-bg2">
      {/* Sidebar - no longer needs props */}
      <Sidebar />

      {/* Main Content */}
      <div className="min-h-screen flex flex-col" style={contentStyle}>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/new" element={<CourseUpsertPage />} />
            <Route
              path="/courses/:courseId/edit"
              element={<CourseUpsertPage />}
            />
            <Route path="/instructors" element={<Instructors />} />
            <Route
              path="/instructors/:instructorId"
              element={<InstructorDetail />}
            />
            <Route path="/instructors/new" element={<InstructorUpsertPage />} />
            <Route
              path="/instructors/:instructorId/edit"
              element={<InstructorUpsertPage />}
            />
            <Route path="/media-library" element={<MediaLibrary />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route
              path="/courses/:courseId/sections/:sectionId"
              element={<SectionDetail />}
            />
            <Route path="/sections/new" element={<SectionUpsertPage />} />
            <Route
              path="/sections/:sectionId/edit"
              element={<SectionUpsertPage />}
            />
            <Route
              path="/sections/:sectionId/content"
              element={<SectionEditPage />}
            />
            <Route
              path="/sections/:sectionId/chapters"
              element={<PlaceholderPage title="Chapters" />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <footer className="bg-bg border-t border-border-primary">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-sm text-text text-center flex justify-center items-center gap-4">
              <p>
                &copy; 2025 I75 Platform Educational Management | Powered By{" "}
                <a
                  href="https://griffinswebservices.com"
                  className="text-primary hover:underline"
                >
                  Griffin's Web Services
                </a>
              </p>
              <ThemeToggle />
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </Router>
  );
}

export default App;
