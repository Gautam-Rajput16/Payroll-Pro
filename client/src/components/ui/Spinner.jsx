import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2 
      className={`animate-spin text-primary ${sizeClasses[size]} ${className}`} 
    />
  );
};

export const FullPageSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-gray-500">Loading...</p>
    </div>
  </div>
);

export const CenterSpinner = ({ text = "Loading..." }) => (
  <div className="flex h-48 w-full flex-col items-center justify-center gap-3">
    <Spinner size="md" />
    <p className="text-sm font-medium text-gray-500">{text}</p>
  </div>
);

export default Spinner;
