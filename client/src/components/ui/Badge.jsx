import React from 'react';

const Badge = ({ children, status, className = '' }) => {
  let colorClass = 'bg-gray-100 text-gray-800'; // default

  switch (status?.toLowerCase()) {
    case 'active':
    case 'paid':
    case 'finalized':
      colorClass = 'bg-emerald-100 text-emerald-800';
      break;
    case 'inactive':
    case 'pending':
    case 'draft':
      colorClass = 'bg-amber-100 text-amber-800';
      break;
    case 'suspended':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'cash':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'upi':
      colorClass = 'bg-purple-100 text-purple-800';
      break;
    case 'bank transfer':
      colorClass = 'bg-indigo-100 text-indigo-800';
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {children || status}
    </span>
  );
};

export default Badge;
