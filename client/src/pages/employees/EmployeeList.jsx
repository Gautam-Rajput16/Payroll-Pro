import React, { useState, useEffect, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Eye, EyeOff, Trash2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CreditCardView from '../../components/ui/CreditCardView';

const BankAccountCell = ({ employee }) => {
  const [showCard, setShowCard] = useState(false);
  
  const { bankName, accountNumber, ifscCode, name } = employee;

  // Masked format for table view (e.g., **** **** **** 1234)
  const maskedAccount = accountNumber && accountNumber.length > 4 
    ? '**** **** **** ' + accountNumber.slice(-4) 
    : accountNumber || '';
  
  return (
    <>
      <div>
        <div className="text-gray-900 font-medium">{bankName || '-'}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="text-xs text-gray-500 font-mono tracking-wider w-[140px]">
            {maskedAccount}
          </div>
          {accountNumber && (
            <button 
              onClick={() => setShowCard(true)}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              title="View Card Details"
            >
              <Eye size={14} />
            </button>
          )}
        </div>
      </div>

      <CreditCardView
        isOpen={showCard}
        onClose={() => setShowCard(false)}
        bankName={bankName}
        accountNumber={accountNumber}
        cardholderName={name}
        ifscCode={ifscCode}
      />
    </>
  );
};

const EmployeeList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  
  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/employees', {
        params: { page, limit, search: searchTerm }
      });
      setData(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page, limit]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/admin/employees/${selectedEmployee._id}`);
      toast.success('Employee soft deleted successfully');
      fetchEmployees(); // refresh
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Emp ID',
      accessorKey: 'employeeId',
      cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>
    },
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
    },
    {
      header: 'Bank',
      accessorKey: 'bankName',
      cell: (info) => (
        <BankAccountCell 
          employee={info.row.original} 
        />
      )
    },
    {
      header: 'Salary',
      accessorKey: 'monthlySalary',
      cell: (info) => `₹${info.getValue()?.toLocaleString('en-IN') || '0'}`
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/employees/${row.original._id}`)}
            className="p-1 text-gray-400 hover:text-primary transition-colors"
            title="View Profile"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={() => navigate(`/employees/edit/${row.original._id}`)}
            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button 
            onClick={() => {
              setSelectedEmployee(row.original);
              setIsDeleteModalOpen(true);
            }}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ], [navigate]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your workforce, salaries, and information.</p>
        </div>
        <Button onClick={() => navigate('/employees/add')} icon={<Plus size={18} />}>
          Add Employee
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="w-full max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : data.length === 0 ? (
            <EmptyState 
              title="No employees found"
              message={searchTerm ? "Try adjusting your search criteria" : "Add your first employee to get started"}
              actionLabel={!searchTerm ? "Add Employee" : undefined}
              onAction={() => navigate('/employees/add')}
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
        
        {/* Pagination Controls */}
        {!loading && data.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${selectedEmployee?.name}? This action will softly delete the record to preserve payroll history.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default EmployeeList;
