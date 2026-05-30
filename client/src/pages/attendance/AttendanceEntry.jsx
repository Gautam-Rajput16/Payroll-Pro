import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent } from '../../components/ui/Card';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const AttendanceEntry = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  
  // Storing attendance locally before saving
  // Format: { [employeeId]: { status: 'Present', notes: '' } }
  const [attendanceData, setAttendanceData] = useState({});
  const [isFinalized, setIsFinalized] = useState(false);
  
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  const fetchAttendance = async (date) => {
    try {
      setLoading(true);
      
      // Fetch active employees
      const empRes = await axiosInstance.get('/admin/employees?limit=100');
      const allEmployees = Array.isArray(empRes.data.data) ? empRes.data.data : [];
      const activeEmployees = allEmployees.filter(emp => emp.status === 'Active');
      setEmployees(activeEmployees);
      
      // Try fetching existing attendance for this date
      const attRes = await axiosInstance.get('/admin/attendance', {
        params: { date }
      });
      
      const attData = attRes.data.data;
      const records = Array.isArray(attData) ? attData : (attData?.records || []);
      const finalized = records.some(r => r.isFinalized);
      setIsFinalized(finalized);
      
      const attMap = {};
      
      if (records.length > 0) {
        // Load existing records
        records.forEach(r => {
          attMap[r.employeeId._id || r.employeeId] = {
            status: r.status,
            notes: r.notes || '',
            id: r._id
          };
        });
        
        // Add active employees that might not have a record yet
        activeEmployees.forEach(emp => {
          if (!attMap[emp._id]) {
             attMap[emp._id] = { status: 'Present', notes: '' };
          }
        });
      } else {
        // Default all active employees to Present if no records
        activeEmployees.forEach(emp => {
          attMap[emp._id] = { status: 'Present', notes: '' };
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
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  const handleStatusChange = (empId, status) => {
    if (isFinalized) return;
    setAttendanceData(prev => ({
      ...prev,
      [empId]: { ...prev[empId], status }
    }));
  };

  const handleNotesChange = (empId, notes) => {
    if (isFinalized) return;
    setAttendanceData(prev => ({
      ...prev,
      [empId]: { ...prev[empId], notes }
    }));
  };

  const handleSaveDraft = async () => {
    if (isFinalized) return;
    setSaving(true);
    try {
      const records = Object.entries(attendanceData).map(([empId, data]) => ({
        employeeId: empId,
        date: selectedDate,
        status: data.status,
        notes: data.notes
      }));
      
      // Assuming a bulk create/update endpoint
      await axiosInstance.post('/admin/attendance/bulk', { records });
      toast.success('Attendance draft saved');
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
        date: selectedDate,
        status: data.status,
        notes: data.notes,
        isFinalized: true
      }));
      
      await axiosInstance.post('/admin/attendance/bulk', { records });
      toast.success('Attendance finalized successfully');
      setIsFinalized(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to finalize attendance');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Entry</h2>
          <p className="text-gray-500 text-sm mt-1">Mark daily attendance for your active employees.</p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 flex items-center shadow-sm">
              <Calendar className="text-gray-400 mr-2 h-5 w-5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none"
              />
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
                  <th className="px-5 py-3 font-medium border-b border-gray-200 w-48">Status</th>
                  <th className="px-5 py-3 font-medium border-b border-gray-200 min-w-[200px]">Notes (Optional)</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const empData = attendanceData[emp._id] || { status: 'Present', notes: '' };
                  
                  return (
                    <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.employeeId}</div>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={empData.status}
                          onChange={(e) => handleStatusChange(emp._id, e.target.value)}
                          disabled={isFinalized}
                          className={`flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:bg-gray-50
                            ${empData.status === 'Absent' ? 'text-red-700 border-red-200 bg-red-50' : 
                              empData.status === 'Half Day' ? 'text-amber-700 border-amber-200 bg-amber-50' : 
                              empData.status === 'Leave' ? 'text-blue-700 border-blue-200 bg-blue-50' : 
                              'text-emerald-700 border-emerald-200 bg-emerald-50'}`}
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Half Day">Half Day</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          value={empData.notes}
                          onChange={(e) => handleNotesChange(emp._id, e.target.value)}
                          disabled={isFinalized}
                          placeholder={isFinalized ? '-' : 'Add note...'}
                          className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:bg-gray-50"
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
        message="Are you sure you want to finalize the attendance for this date? Once finalized, you cannot modify these records."
        confirmText="Finalize"
        isDanger={false}
      />
    </div>
  );
};

export default AttendanceEntry;
