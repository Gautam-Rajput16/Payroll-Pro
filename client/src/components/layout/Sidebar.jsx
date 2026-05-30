import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Banknote, 
  CalendarCheck, 
  Calculator, 
  FileText, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Employees', path: '/employees', icon: <Users size={20} /> },
    { name: 'Advances', path: '/advances', icon: <Banknote size={20} /> },
    { name: 'Attendance', path: '/attendance', icon: <CalendarCheck size={20} /> },
    { name: 'Salary', path: '/salary', icon: <Calculator size={20} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo/Brand Area */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
            P
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Payroll<span className="text-primary">Pro</span></span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-primary font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</span>
            <span className="text-xs text-gray-500 truncate max-w-[140px]">{user?.email || 'admin@example.com'}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
