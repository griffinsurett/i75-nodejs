// frontend/src/components/navigation/BackButton.jsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ 
  to, 
  children, 
  confirmNavigation = false,
  confirmCondition = true, // Only show confirm if this is true
  confirmMessage = 'You have unsaved changes. Are you sure you want to leave?',
  className = '',
  onClick,
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    
    // Check if we need to confirm
    if (confirmNavigation && confirmCondition) {
      if (window.confirm(confirmMessage)) {
        if (onClick) onClick();
        navigate(to);
      }
    } else {
      if (onClick) onClick();
      navigate(to);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center text-primary hover:text-primary/65 ${className}`}
      type="button"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {children}
    </button>
  );
}