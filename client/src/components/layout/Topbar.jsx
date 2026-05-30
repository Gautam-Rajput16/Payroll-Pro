import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Menu } from 'lucide-react';

const Topbar = ({ toggleMenu }) => {
  const { user } = useAuth();

  // Extract org name from user object or fallback
  const orgName = user?.organizationId?.name || user?.organizationName || 'Organization Name';

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 relative z-10">
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={toggleMenu}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700 md:hidden transition-colors rounded-lg"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate max-w-[140px] sm:max-w-xs">{orgName}</h1>
        <span className="hidden sm:inline-flex rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">
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
