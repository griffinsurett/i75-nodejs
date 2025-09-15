import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import CourseCreatePage from './pages/CourseCreatePage';
import CourseEditPage from './pages/CourseEditPage';
import CourseUpsertPage from './pages/CourseUpsertPage';
// Pages
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <Router>
      {/* Give the layout a default sidebar width (matches open state).
          Sidebar will update --sidebar-w on the :root as user toggles. */}
      <div className="min-h-screen w-screen bg-bg2" style={{ ['--sidebar-w']: '16rem' }}>
        {/* Sidebar */}
        <Sidebar widthClass="" />

        {/* Main (pad left by current sidebar width; animate changes) */}
        <div className="pl-[var(--sidebar-w)] transition-[padding-left] duration-300 ease-in-out">
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CourseList />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/new" element={<CourseUpsertPage />} />
              <Route path="/courses/:courseId/edit" element={<CourseUpsertPage />} />
              <Route path="/instructors" element={<PlaceholderPage title="Instructors" />} />
              <Route path="/content" element={<PlaceholderPage title="Content Library" />} />
              <Route path="/assessments" element={<PlaceholderPage title="Assessments" />} />
              <Route path="/sections/:sectionId/chapters" element={<PlaceholderPage title="Chapters" />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          <footer className="bg-bg border-t border-border-primary">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-sm text-text text-center flex justify-center items-center gap-4">
                <p>&copy; 2025 I75 Platform Educational Management</p>
                <ThemeToggle />
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;
