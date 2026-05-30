import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileIcon } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [loading, setLoading] = useState({
    salary: false,
    advances: false,
    attendance: false
  });
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
  }));

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: currentDate.getFullYear() - i,
    label: (currentDate.getFullYear() - i).toString()
  }));

  const downloadExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleExportSalary = async () => {
    setLoading(prev => ({ ...prev, salary: true }));
    try {
      const res = await axiosInstance.get('/admin/reports/salary', { params: { month, year } });
      const salaries = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.salaries || []);
      const data = salaries.map(s => ({
        'Employee ID': s.employeeId?.employeeId,
        'Name': s.employeeId?.name,
        'Designation': s.employeeId?.designation,
        'Base Salary': s.baseSalary,
        'Net Salary': s.netSalary,
        'Advances Deducted': s.totalAdvanceDeductions || 0,
        'Leaves Deducted': s.leaveDeductions || 0,
        'Status': s.status
      }));
      
      if (data.length === 0) {
        toast.error('No salary records found for selected month');
        return;
      }
      
      downloadExcel(data, `Salary_Report_${month}_${year}`);
      toast.success('Salary report exported successfully');
    } catch (error) {
      toast.error('Failed to export salary report');
    } finally {
      setLoading(prev => ({ ...prev, salary: false }));
    }
  };

  const handleExportAdvances = async () => {
    setLoading(prev => ({ ...prev, advances: true }));
    try {
      const res = await axiosInstance.get('/admin/reports/advances', { params: { month, year } });
      const advances = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.advances || []);
      const data = advances.map(a => ({
        'Employee ID': a.employeeId?.employeeId,
        'Name': a.employeeId?.name,
        'Amount': a.amount,
        'Date': new Date(a.date).toLocaleDateString(),
        'Reason': a.reason,
        'Status': a.status
      }));
      
      if (data.length === 0) {
        toast.error('No advance records found for selected month');
        return;
      }
      
      downloadExcel(data, `Advances_Report_${month}_${year}`);
      toast.success('Advances report exported successfully');
    } catch (error) {
      toast.error('Failed to export advances report');
    } finally {
      setLoading(prev => ({ ...prev, advances: false }));
    }
  };

  const handleExportAttendance = async () => {
    setLoading(prev => ({ ...prev, attendance: true }));
    try {
      const res = await axiosInstance.get('/admin/reports/attendance', { params: { month, year } });
      const records = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.records || []);
      const data = records.map(r => ({
        'Employee ID': r.employeeId?.employeeId,
        'Name': r.employeeId?.name,
        'Date': new Date(r.date).toLocaleDateString(),
        'Status': r.status,
        'Notes': r.notes || ''
      }));
      
      if (data.length === 0) {
        toast.error('No attendance records found for selected month');
        return;
      }
      
      downloadExcel(data, `Attendance_Report_${month}_${year}`);
      toast.success('Attendance report exported successfully');
    } catch (error) {
      toast.error('Failed to export attendance report');
    } finally {
      setLoading(prev => ({ ...prev, attendance: false }));
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">Export your organisation's data for accounting and compliance.</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6 mb-8">
        <div className="w-1/3">
          <Select 
            label="Select Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            options={months}
          />
        </div>
        <div className="w-1/3">
          <Select 
            label="Select Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            options={years}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Salary Report */}
        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-primary mb-4">
              <FileSpreadsheet size={24} />
            </div>
            <CardTitle>Salary Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-6 h-10">
              Detailed breakdown of basic salary, deductions, and net payable.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                className="w-full justify-start" 
                onClick={handleExportSalary}
                loading={loading.salary}
                icon={!loading.salary && <Download size={18} />}
              >
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advances Report */}
        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 mb-4">
              <FileIcon size={24} />
            </div>
            <CardTitle>Advances Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-6 h-10">
              Log of all advances granted and their current recovery status.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="secondary"
                className="w-full justify-start" 
                onClick={handleExportAdvances}
                loading={loading.advances}
                icon={!loading.advances && <Download size={18} />}
              >
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Report */}
        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-4">
              <FileSpreadsheet size={24} />
            </div>
            <CardTitle>Attendance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-6 h-10">
              Daily attendance logs, leaves, and absences for the month.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="secondary"
                className="w-full justify-start" 
                onClick={handleExportAttendance}
                loading={loading.attendance}
                icon={!loading.attendance && <Download size={18} />}
              >
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Reports;
