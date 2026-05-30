import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const SalaryChart = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm w-full h-[400px]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Salary Payout Overview</h3>
        <p className="text-sm text-gray-500">Monthly breakdown of salary and advance payouts</p>
      </div>
      
      <div className="w-full h-[300px]">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`}
              />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, undefined]}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="salary" name="Net Salary" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="advance" name="Advances" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            No salary data available for the chart
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryChart;
