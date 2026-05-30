import React, { useState, useEffect } from 'react';
import { Calendar, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const AttendanceEntry = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Format: { [employeeId]: { presentDays: 26, workingDays: 26, id: '...', status: 'Draft' } }
  const [attendanceData, setAttendanceData] = useState({});
  const [isFinalized, setIsFinalized] = useState(false);
  
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  const fetchAttendance = async (month, year) => {
    try {
      setLoading(true);
      
      // Fetch active employees
      const empRes = await axiosInstance.get('/admin/employees?limit=100');
      // Fix potential mapping issue with empRes.data.data
      const responseData = empRes.data.data;
      const allEmployees = Array.isArray(responseData) ? responseData : (responseData?.employees || []);
      const activeEmployees = allEmployees.filter(emp => emp.status === 'Active');
      setEmployees(activeEmployees);
      
      // Try fetching existing attendance for this month/year
      const attRes = await axiosInstance.get('/admin/attendance', {
        params: { month, year }
      });
      
      const attData = attRes.data.data;
      const records = Array.isArray(attData) ? attData : (attData?.records || []);
      const finalized = records.some(r => r.status === 'Finalized');
      setIsFinalized(finalized);
      
      const attMap = {};
      
      if (records.length > 0) {
        // Load existing records
        records.forEach(r => {
          attMap[r.employeeId._id || r.employeeId] = {
            presentDays: r.presentDays,
            workingDays: r.workingDays,
            id: r._id,
            status: r.status
          };
        });
        
        // Add active employees that might not have a record yet
        activeEmployees.forEach(emp => {
          if (!attMap[emp._id]) {
             attMap[emp._id] = { presentDays: 26, workingDays: 26, status: 'Draft' };
          }
        });
      } else {
        // Default all active employees
        activeEmployees.forEach(emp => {
          attMap[emp._id] = { presentDays: 26, workingDays: 26, status: 'Draft' };
        });
      }
      
      setAttendanceData(attMap);
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const handleWorkingDaysChange = (empId, days) => {
    if (isFinalized) return;
    setAttendanceData(prev => ({
      ...prev,
      [empId]: { ...prev[empId], workingDays: days }
    }));
  };

  const handlePresentDaysChange = (empId, days) => {
    if (isFinalized) return;
    setAttendanceData(prev => ({
      ...prev,
      [empId]: { ...prev[empId], presentDays: days }
    }));
  };

  const handleSaveDraft = async () => {
    if (isFinalized) return;
    setSaving(true);
    try {
      const records = Object.entries(attendanceData).map(([empId, data]) => ({
        employeeId: empId,
        presentDays: data.presentDays,
        workingDays: data.workingDays
      }));
      
      await axiosInstance.post('/admin/attendance/bulk', { month: selectedMonth, year: selectedYear, records });
      toast.success('Attendance draft saved');
      fetchAttendance(selectedMonth, selectedYear);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      // First save draft, then finalize via an endpoint or by passing isFinalized
      const records = Object.entries(attendanceData).map(([empId, data]) => ({
        employeeId: empId,
        presentDays: data.presentDays,
        workingDays: data.workingDays
      }));
      
      await axiosInstance.post('/admin/attendance/bulk', { month: selectedMonth, year: selectedYear, records });
      
      await axiosInstance.post('/admin/attendance/finalize', { month: selectedMonth, year: selectedYear });
      toast.success('Attendance finalized successfully');
      setIsFinalized(true);
      fetchAttendance(selectedMonth, selectedYear);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to finalize attendance');
    } finally {
      setFinalizing(false);
      setIsFinalizeModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monthly Attendance Entry</h2>
          <p className="text-gray-500 text-sm mt-1">Mark monthly attendance (working and present days) for your active employees.</p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 flex items-center shadow-sm">
              <Calendar className="text-gray-400 mr-2 h-5 w-5" />
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none"
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>
                ))}
              </select>
              <span className="mx-2 text-gray-300">/</span>
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none"
              >
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            {isFinalized && (
              <div className="flex items-center text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Finalized
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {!isFinalized && (
              <>
                <Button 
                  variant="secondary" 
                  onClick={handleSaveDraft} 
                  loading={saving}
                  disabled={employees.length === 0}
                  icon={!saving && <Save size={16} />}
                >
                  Save Draft
                </Button>
                <Button 
                  onClick={() => setIsFinalizeModalOpen(true)}
                  disabled={employees.length === 0}
                  icon={<CheckCircle size={16} />}
                >
                  Finalize
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <TableSkeleton rows={8} cols={4} />
          ) : employees.length === 0 ? (
            <EmptyState 
              title="No active employees"
              message="You need active employees to mark attendance."
            />
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-5 py-3 font-medium border-b border-gray-200">Employee</th>
                  <th className="px-5 py-3 font-medium border-b border-gray-200 w-48">Working Days</th>
                  <th className="px-5 py-3 font-medium border-b border-gray-200 w-48">Present Days</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const empData = attendanceData[emp._id] || { presentDays: 26, workingDays: 26, status: 'Draft' };
                  
                  return (
                    <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.employeeId}</div>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min="0"
                          max="31"
                          value={empData.workingDays}
                          onChange={(e) => handleWorkingDaysChange(emp._id, Number(e.target.value))}
                          disabled={isFinalized}
                          className="flex h-9 w-24 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:bg-gray-50"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min="0"
                          max={empData.workingDays}
                          value={empData.presentDays}
                          onChange={(e) => handlePresentDaysChange(emp._id, Number(e.target.value))}
                          disabled={isFinalized}
                          className="flex h-9 w-24 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:bg-gray-50"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        onConfirm={handleFinalize}
        title="Finalize Attendance"
        message="Are you sure you want to finalize the attendance for this month? Once finalized, you cannot modify these records."
        confirmText="Finalize"
        isDanger={false}
      />
    </div>
  );
};

export default AttendanceEntry;
