import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-heading mb-4">Page Not Found</h1>
      <p className="text-text mb-8">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="inline-flex items-center text-primary hover:text-primary/65"
      >
        <Home className="w-4 h-4 mr-2" />
        Back to Home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;