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

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg2">
        {/* Sidebar */}
        <Sidebar widthClass="w-64" />

        {/* Main */}
        <div className="pl-64">
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
               <div className="text-sm text-text text-center">
            <p>&copy; 2025 I75 Platform Educational Management</p>
          </div>
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;
