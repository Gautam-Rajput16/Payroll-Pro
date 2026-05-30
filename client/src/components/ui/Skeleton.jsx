import React from 'react';

const Skeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="w-full">
    <div className="flex border-b border-gray-200 p-4 gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex border-b border-gray-100 p-4 gap-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 flex-1 bg-gray-100" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <Skeleton className="mb-4 h-6 w-1/3" />
    <Skeleton className="mb-2 h-4 w-full bg-gray-100" />
    <Skeleton className="mb-2 h-4 w-5/6 bg-gray-100" />
    <Skeleton className="h-4 w-4/6 bg-gray-100" />
  </div>
);

export const StatCardSkeleton = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1">
      <Skeleton className="mb-2 h-4 w-24 bg-gray-100" />
      <Skeleton className="h-6 w-16" />
    </div>
  </div>
);

export default Skeleton;
