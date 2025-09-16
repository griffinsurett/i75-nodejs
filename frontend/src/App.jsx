import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  // Track sidebar state at the app level
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Handle responsive default state
  useEffect(() => {
    const checkWidth = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  return (
    <Router>
      <div className="app-wrapper">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />

        {/* Main Content Area */}
        <div className={`app-content ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
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

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="sidebar-mobile-overlay lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </Router>
  );
}

export default App;