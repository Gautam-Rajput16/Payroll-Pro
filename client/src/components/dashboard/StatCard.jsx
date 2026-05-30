import React from 'react';

const StatCard = ({ title, value, icon, trend, trendValue, isCurrency = false }) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            {isCurrency ? `₹${value?.toLocaleString('en-IN')}` : value}
          </h3>
        </div>
        <div className="p-3 rounded-lg bg-indigo-50 text-primary">
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
          </span>
          <span className="text-gray-500 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
