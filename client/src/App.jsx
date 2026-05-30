import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Employees
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeForm from './pages/employees/EmployeeForm';
import EmployeeProfile from './pages/employees/EmployeeProfile';

// Advances
import AdvanceList from './pages/advances/AdvanceList';
import AdvanceForm from './pages/advances/AdvanceForm';

// Attendance
import AttendanceEntry from './pages/attendance/AttendanceEntry';

// Salary
import SalaryCalculate from './pages/salary/SalaryCalculate';

// Reports
import Reports from './pages/reports/Reports';

// Settings
import Settings from './pages/settings/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public / Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Routes */}
          <Route 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/change-password" element={<ChangePassword />} />
            
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/add" element={<EmployeeForm />} />
            <Route path="/employees/edit/:id" element={<EmployeeForm />} />
            <Route path="/employees/:id" element={<EmployeeProfile />} />
            
            <Route path="/advances" element={<AdvanceList />} />
            <Route path="/advances/add" element={<AdvanceForm />} />
            <Route path="/advances/edit/:id" element={<AdvanceForm />} />
            
            <Route path="/attendance" element={<AttendanceEntry />} />
            <Route path="/salary" element={<SalaryCalculate />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
