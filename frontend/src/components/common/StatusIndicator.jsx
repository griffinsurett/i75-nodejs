// frontend/src/components/common/StatusIndicator.jsx
import { AlertTriangle, Clock, Check, X, AlertCircle } from 'lucide-react';

const statusConfigs = {
  pendingDeletion: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    label: 'Pending Deletion'
  },
  scheduledDeletion: {
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    label: 'Scheduled for Deletion'
  },
  archived: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    label: 'Archived'
  },
  unsaved: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    label: 'Unsaved Changes'
  },
  saved: {
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    label: 'Saved'
  },
  error: {
    icon: X,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    label: 'Error'
  }
};

export default function StatusIndicator({ 
  status, 
  label, 
  size = 'sm',
  showIcon = true,
  showLabel = true,
  className = '' 
}) {
  const config = statusConfigs[status] || statusConfigs.error;
  const Icon = config.icon;
  
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5'
  };

  return (
    <div className={`inline-flex items-center gap-1 rounded ${config.bgColor} ${config.color} ${sizeClasses[size]} ${className}`}>
      {showIcon && <Icon className={size === 'xs' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {showLabel && <span>{label || config.label}</span>}
    </div>
  );
}