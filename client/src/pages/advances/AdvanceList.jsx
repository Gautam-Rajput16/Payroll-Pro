import React, { useState, useEffect, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const AdvanceList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);

  const fetchAdvances = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/advances', {
        params: { page, limit, search: searchTerm }
      });
      const responseData = res.data.data;
      const advancesArray = Array.isArray(responseData) ? responseData : (responseData?.advances || []);
      setData(advancesArray);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch advances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAdvances();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page, limit]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/admin/advances/${selectedAdvance._id}`);
      toast.success('Advance deleted successfully');
      fetchAdvances();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete advance');
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Employee',
      accessorKey: 'employeeId',
      cell: (info) => {
        const emp = info.getValue();
        return emp ? (
          <div>
            <div className="font-medium text-gray-900">{emp.name}</div>
            <div className="text-xs text-gray-500">{emp.employeeId}</div>
          </div>
        ) : 'Unknown';
      }
    },
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (info) => format(new Date(info.getValue()), 'dd MMM yyyy')
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (info) => `₹${info.getValue()?.toLocaleString('en-IN')}`
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      cell: (info) => <div className="truncate max-w-[200px]" title={info.getValue()}>{info.getValue() || '-'}</div>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (info) => <Badge status={info.getValue()} />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.status !== 'Deducted' && (
            <button 
              onClick={() => navigate(`/advances/edit/${row.original._id}`)}
              className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Edit"
            >
              <Edit size={18} />
            </button>
          )}
          {row.original.status !== 'Deducted' && (
            <button 
              onClick={() => {
                setSelectedAdvance(row.original);
                setIsDeleteModalOpen(true);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
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
          <h2 className="text-2xl font-bold text-gray-900">Advances</h2>
          <p className="text-gray-500 text-sm mt-1">Manage employee salary advances and deductions.</p>
        </div>
        <Button onClick={() => navigate('/advances/add')} icon={<Plus size={18} />}>
          Grant Advance
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="w-full max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by employee name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : data.length === 0 ? (
            <EmptyState 
              title="No advances found"
              message={searchTerm ? "Try adjusting your search criteria" : "Grant your first advance to an employee"}
              actionLabel={!searchTerm ? "Grant Advance" : undefined}
              onAction={() => navigate('/advances/add')}
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
        title="Delete Advance"
        message={`Are you sure you want to delete this advance of ₹${selectedAdvance?.amount?.toLocaleString()}? This action will softly delete the record to preserve audit history.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default AdvanceList;
