// frontend/src/components/navigation/BackButton.jsx
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center text-primary hover:text-primary/65"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {children}
    </Link>
  );
}