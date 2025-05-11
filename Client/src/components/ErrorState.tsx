import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <p className="text-red-600 text-lg">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  </div>
);

export default ErrorState;