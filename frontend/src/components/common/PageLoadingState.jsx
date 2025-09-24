// components/common/PageLoadingState.jsx
import { Loader2 } from 'lucide-react';

export default function PageLoadingState({ message = "Loading..." }) {
  return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2 text-text/70">{message}</span>
    </div>
  );
}