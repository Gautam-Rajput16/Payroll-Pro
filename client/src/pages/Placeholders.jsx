import React from 'react';

const Placeholder = ({ title }) => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    </div>
    <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
      {title} Module (Work in progress)
    </div>
  </div>
);

export const EmployeeList = () => <Placeholder title="Employees" />;
export const AdvanceList = () => <Placeholder title="Advances" />;
export const AttendanceEntry = () => <Placeholder title="Attendance" />;
export const SalaryCalculate = () => <Placeholder title="Salary Calculation" />;
export const Reports = () => <Placeholder title="Reports" />;
export const Settings = () => <Placeholder title="Settings" />;
