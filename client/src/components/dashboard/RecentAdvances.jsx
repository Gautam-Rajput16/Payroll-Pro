import React from 'react';
import Badge from '../ui/Badge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const RecentAdvances = ({ advances = [] }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Recent Advances</h3>
        <button 
          onClick={() => navigate('/advances')}
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          View All
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-5 py-3 font-medium">Employee</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {advances.length > 0 ? (
              advances.map((advance) => (
                <tr key={advance._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{advance.employeeId?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{advance.employeeId?.employeeId || '-'}</div>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    ₹{advance.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3">
                    {advance.date ? format(new Date(advance.date), 'dd MMM yyyy') : '-'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={advance.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-5 py-8 text-center text-gray-500">
                  No recent advances found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentAdvances;
