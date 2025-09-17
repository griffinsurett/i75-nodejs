import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import CourseUpsertPage from './pages/CourseUpsertPage';
// Pages
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFoundPage from './pages/NotFoundPage';
import MediaLibrary from './pages/MediaLibrary';

// Components
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';

function App() {
  // Track sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle responsive behavior
  useEffect(() => {
    const checkWidth = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On desktop default to open, on mobile default to closed
      if (mobile !== isMobile) {
        setSidebarOpen(!mobile);
      }
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []); // eslint-disable-line

  // Content margin calculation
  // Desktop: adjust based on sidebar state
  // Mobile: always have collapsed width (64px) margin
  const contentStyle = {
    marginLeft: isMobile ? '64px' : (sidebarOpen ? '256px' : '64px'),
    transition: 'margin-left 300ms ease-in-out'
  };

  return (
    <Router>
      <div className="min-h-screen bg-bg2">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <div 
          className="min-h-screen flex flex-col"
          style={contentStyle}
        >
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CourseList />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/new" element={<CourseUpsertPage />} />
              <Route path="/courses/:courseId/edit" element={<CourseUpsertPage />} />
              <Route path="/instructors" element={<PlaceholderPage title="Instructors" />} />
              <Route path="/media-library" element={<MediaLibrary />} />
              <Route path="/sections/:sectionId/chapters" element={<PlaceholderPage title="Chapters" />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          <footer className="bg-bg border-t border-border-primary">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-sm text-text text-center flex justify-center items-center gap-4">
                <p>&copy; 2025 I75 Platform Educational Management | Powered By <a href='https://griffinswebservices.com' className='text-primary hover:underline'>Griffin's Web Services</a></p>
                <ThemeToggle />
              </div>
            </div>
          </footer>
        </div>

        {/* Mobile Overlay - only show when sidebar is open on mobile */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </Router>
  );
}

export default App;