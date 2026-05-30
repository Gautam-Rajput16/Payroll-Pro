import React from 'react';
import Button from './Button';

const EmptyState = ({ 
  icon, 
  title = 'No Data Found', 
  message = "There's nothing to display here yet.", 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 w-full min-h-[300px]">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{message}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
