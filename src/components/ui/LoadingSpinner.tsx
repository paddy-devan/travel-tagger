import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ size = 'medium' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-5 w-5 border-t-2 border-b-2',
    medium: 'h-8 w-8 border-t-2 border-b-2',
    large: 'h-12 w-12 border-t-2 border-b-2'
  };

  const spinnerClass = sizeClasses[size];
  const showText = size !== 'small';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full ${spinnerClass} border-blue-500`}></div>
      {showText && <p className="mt-2 text-sm text-gray-600">Loading...</p>}
    </div>
  );
} 