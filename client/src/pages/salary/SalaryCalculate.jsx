import React, { useState, useEffect, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { Calculator, Download, Eye, FileText, CheckCircle } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SalarySlipModal from './SalarySlipModal';

const SalaryCalculate = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  
  const [isCalculateModalOpen, setIsCalculateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [calculating, setCalculating] = useState(false);
  
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipEmployeeId, setSlipEmployeeId] = useState(null);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2000, i, 1), 'MMMM')
  }));

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: currentDate.getFullYear() - i,
    label: (currentDate.getFullYear() - i).toString()
  }));

  const fetchSalaryStatus = async () => {
    try {
      setLoading(true);
      
      const [empRes, salRes, attRes, advRes] = await Promise.all([
        axiosInstance.get('/admin/employees?limit=100'),
        axiosInstance.get('/admin/salary', { params: { month, year, limit: 100 } }),
        axiosInstance.get('/admin/attendance', { params: { month, year } }),
        axiosInstance.get('/admin/advances/summary', { params: { month, year } })
      ]);
      
      const responseData = empRes.data.data;
      const allEmployees = Array.isArray(responseData) ? responseData : (responseData?.employees || []);
      const activeEmployees = allEmployees.filter(e => e.status === 'Active');
      
      const generatedSalaries = Array.isArray(salRes.data.data) ? salRes.data.data : (salRes.data.data?.salaries || []);
      const attendanceData = Array.isArray(attRes.data.data) ? attRes.data.data : (attRes.data.data?.records || []);
      const advanceData = Array.isArray(advRes.data.data) ? advRes.data.data : [];
      
      const mappedData = activeEmployees.map(emp => {
        const salaryRecord = generatedSalaries.find(s => s.employeeId?._id === emp._id || s.employeeId === emp._id);
        const attRecord = attendanceData.find(a => a.employeeId?._id === emp._id || a.employeeId === emp._id);
        const advRecord = advanceData.find(a => a.employeeId === emp._id);

        return {
          employee: emp,
          isGenerated: !!salaryRecord,
          salaryId: salaryRecord?._id,
          netSalary: salaryRecord?.netSalary,
          totalAdvances: salaryRecord ? salaryRecord.totalAdvances : (advRecord?.totalAdvances || 0),
          workingDays: salaryRecord ? salaryRecord.workingDaysSnapshot : (attRecord?.workingDays || '-'),
          presentDays: salaryRecord ? salaryRecord.presentDays : (attRecord?.presentDays || '-'),
          status: salaryRecord?.paymentStatus || 'Pending'
        };
      });
      
      setData(mappedData);
    } catch (error) {
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStatus();
  }, [month, year]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await axiosInstance.post('/admin/salary/calculate', {
        employeeId: selectedEmployee._id,
        month,
        year
      });
      toast.success('Salary calculated and generated successfully');
      fetchSalaryStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to calculate salary');
    } finally {
      setCalculating(false);
      setIsCalculateModalOpen(false);
    }
  };

  const handleMarkAsPaid = async (salaryId) => {
    try {
      await axiosInstance.patch(`/admin/salary/${salaryId}/status`, { paymentStatus: 'Paid' });
      toast.success('Salary marked as paid');
      fetchSalaryStatus();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleBankExport = () => {
    const generated = data.filter(d => d.isGenerated);
    if (generated.length === 0) {
      toast.error('No generated salaries to export');
      return;
    }

    const headers = ['Employee Code', 'Employee Name', 'Bank Name', 'Account Number', 'IFSC Code', 'Amount Payable'];
    const rows = generated.map(d => [
      d.employee.employeeId,
      d.employee.name,
      d.employee.bankName || 'N/A',
      d.employee.accountNumber || 'N/A',
      d.employee.ifscCode || 'N/A',
      d.netSalary
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bank_Export_${months.find(m => m.value === month)?.label}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo(() => [
    {
      header: 'Employee',
      accessorKey: 'employee',
      cell: (info) => (
        <div>
          <div className="font-medium text-gray-900">{info.getValue().name}</div>
          <div className="text-xs text-gray-500">{info.getValue().employeeId}</div>
        </div>
      )
    },
    {
      header: 'Base Salary',
      accessorFn: row => row.employee.monthlySalary,
      cell: (info) => `₹${info.getValue()?.toLocaleString('en-IN')}`
    },
    {
      header: 'Working Days',
      accessorFn: row => `${row.presentDays} / ${row.workingDays}`,
      cell: (info) => info.getValue()
    },
    {
      header: 'Advances',
      accessorKey: 'totalAdvances',
      cell: (info) => info.getValue() > 0 ? `- ₹${info.getValue().toLocaleString('en-IN')}` : '-'
    },
    {
      header: 'Net Salary',
      accessorKey: 'netSalary',
      cell: (info) => info.getValue() ? `₹${info.getValue().toLocaleString('en-IN')}` : '-'
    },
    {
      header: 'Status',
      accessorKey: 'isGenerated',
      cell: ({ row }) => (
        <Badge 
          status={row.original.isGenerated ? row.original.status : 'Not Generated'} 
          className={!row.original.isGenerated ? 'bg-gray-100 text-gray-600' : ''}
        />
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {!row.original.isGenerated ? (
            <Button 
              size="sm" 
              icon={<Calculator size={14} />}
              onClick={() => {
                setSelectedEmployee(row.original.employee);
                setIsCalculateModalOpen(true);
              }}
            >
              Calculate
            </Button>
          ) : (
            <>
              {row.original.status !== 'Paid' && (
                <Button 
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                  icon={<CheckCircle size={14} />}
                  onClick={() => handleMarkAsPaid(row.original.salaryId)}
                >
                  Mark Paid
                </Button>
              )}
              <Button 
                size="sm" 
                variant="secondary"
                icon={<FileText size={14} />}
                onClick={() => {
                  setSlipEmployeeId(row.original.employee._id);
                  setIsSlipModalOpen(true);
                }}
              >
                View Slip
              </Button>
            </>
          )}
        </div>
      )
    }
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salary Processing</h2>
          <p className="text-gray-500 text-sm mt-1">Calculate salaries based on attendance and advances.</p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select 
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              options={months}
              className="w-40"
            />
            <Select 
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              options={years}
              className="w-32"
            />
          </div>
          
          <Button 
            variant="secondary" 
            icon={<Download size={16} />}
            onClick={handleBankExport}
          >
            Bank Export
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : data.length === 0 ? (
            <EmptyState 
              title="No active employees"
              message="No employees available for salary calculation."
            />
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="px-5 py-3 font-medium border-b border-gray-200">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-5 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isCalculateModalOpen}
        onClose={() => setIsCalculateModalOpen(false)}
        onConfirm={handleCalculate}
        title="Calculate Salary"
        message={`Are you sure you want to calculate and generate the salary for ${selectedEmployee?.name} for ${months.find(m => m.value === month)?.label} ${year}? This will deduct active advances based on the snapshot.`}
        confirmText="Calculate & Generate"
        isDanger={false}
      />
      
      <SalarySlipModal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        employeeId={slipEmployeeId}
        month={month}
        year={year}
      />
    </div>
  );
};

export default SalaryCalculate;
