import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import StatCard from '../../components/dashboard/StatCard';
import SalaryChart from '../../components/dashboard/SalaryChart';
import RecentAdvances from '../../components/dashboard/RecentAdvances';
import { Users, Banknote, CalendarX2, Wallet } from 'lucide-react';
import { FullPageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalEmployees: 0,
      activeAdvances: 0,
      pendingLeaves: 0,
      totalSalaryThisMonth: 0,
    },
    salaryChart: [],
    recentAdvances: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/admin/dashboard');
        const apiData = response.data.data;
        setData({
          stats: {
            totalEmployees: apiData.totalEmployees || 0,
            activeAdvances: apiData.totalAdvancesThisMonthAmount || 0,
            pendingLeaves: apiData.employeesWithPendingAttendance || 0,
            totalSalaryThisMonth: (apiData.totalSalaryPendingAmount || 0) + (apiData.totalSalaryPaidAmount || 0),
          },
          salaryChart: [], // Placeholder since backend doesn't return chart data yet
          recentAdvances: apiData.recentAdvances || [],
        });
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <FullPageSpinner />;
  }

  const { stats, salaryChart, recentAdvances } = data;

  return (
    <div className="space-y-6 pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back! Here's what's happening in your organisation today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees || 0}
          icon={<Users size={24} />}
          trend="up"
          trendValue="12%"
        />
        <StatCard
          title="Total Advances (Active)"
          value={stats.activeAdvances || 0}
          isCurrency={true}
          icon={<Banknote size={24} />}
          trend="down"
          trendValue="5%"
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves || 0}
          icon={<CalendarX2 size={24} />}
          trend="up"
          trendValue="2"
        />
        <StatCard
          title="Est. Payout (This Month)"
          value={stats.totalSalaryThisMonth || 0}
          isCurrency={true}
          icon={<Wallet size={24} />}
        />
      </div>

      {/* Charts & Tables Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex">
          <SalaryChart data={salaryChart} />
        </div>
        <div className="lg:col-span-1 flex">
          <RecentAdvances advances={recentAdvances} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
