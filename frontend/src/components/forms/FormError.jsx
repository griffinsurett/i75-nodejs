import { AlertCircle } from 'lucide-react';

export function FormError({ error, className = '' }) {
  if (!error) return null;
  
  return (
    <div className={`mb-3 text-sm text-red-600 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded p-2 flex items-start gap-2 ${className}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}