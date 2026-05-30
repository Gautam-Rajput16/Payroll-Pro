import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell } from 'lucide-react';

const Topbar = () => {
  const { user } = useAuth();

  // Extract org name from user object or fallback
  const orgName = user?.organizationId?.name || user?.organizationName || 'Organization Name';

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800">{orgName}</h1>
        <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">
          Admin Panel
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
