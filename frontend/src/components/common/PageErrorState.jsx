// components/common/PageErrorState.jsx
import { AlertCircle } from 'lucide-react';
import BackButton from '../navigation/BackButton';

export default function PageErrorState({ error, backUrl, backLabel = "Go Back" }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-center min-h-64 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
      {backUrl && (
        <div className="mt-4 text-center">
          <BackButton to={backUrl}>{backLabel}</BackButton>
        </div>
      )}
    </div>
  );
}