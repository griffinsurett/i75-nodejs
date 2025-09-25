// frontend/src/components/common/DateDisplay.jsx
import { Calendar, Clock } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

export default function DateDisplay({ 
  label, 
  date, 
  icon = "calendar",
  variant = "default",
  className = "" 
}) {
  if (!date) return null;
  
  const Icon = icon === "clock" ? Clock : Calendar;
  
  if (variant === "compact") {
    return (
      <div className={`flex items-center text-sm text-text ${className}`}>
        <Icon className="w-4 h-4 mr-2" />
        <span>{label}: {formatDate(date, { variant: "short" })}</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center text-text/70 ${className}`}>
      <Icon className="w-5 h-5 mr-2" />
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm">{formatDate(date)}</div>
      </div>
    </div>
  );
}