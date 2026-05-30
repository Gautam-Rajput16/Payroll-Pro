import React from 'react';

const Card = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {!noPadding ? (
        <div className="p-5">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-b border-gray-200 bg-gray-50/50 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-800 ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-t border-gray-200 bg-gray-50/50 ${className}`}>
    {children}
  </div>
);

export default Card;
