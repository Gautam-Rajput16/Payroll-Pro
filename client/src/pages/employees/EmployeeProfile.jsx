import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, User, Phone, Mail, Building, Briefcase, Calendar, Edit, Banknote } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { FullPageSpinner } from '../../components/ui/Spinner';
import RecentAdvances from '../../components/dashboard/RecentAdvances';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch employee details
        const res = await axiosInstance.get(`/admin/employees/${id}`);
        
        // Let's also fetch their advances (you might need an endpoint or filter list)
        // For now, we will simulate the advances part or fetch from advances API with employeeId
        const advancesRes = await axiosInstance.get('/admin/advances', {
           params: { employeeId: id, limit: 5 }
        });
        
        setEmployee({
          ...res.data.data,
          advances: advancesRes.data.data.advances || []
        });
      } catch (error) {
        toast.error('Failed to load employee profile');
        navigate('/employees');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate]);

  if (loading) return <FullPageSpinner />;
  if (!employee) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/employees')}
            className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full border border-gray-200 shadow-sm transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Profile</h2>
          </div>
        </div>
        <Button onClick={() => navigate(`/employees/edit/${id}`)} icon={<Edit size={16} />}>
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                <User size={40} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{employee.name}</h3>
              <div className="mt-3">
                <Badge status={employee.status} />
              </div>
              <div className="mt-6 border-t border-gray-100 pt-6 space-y-4 text-left">
                <div className="flex items-center text-gray-600 text-sm">
                  <Phone className="h-4 w-4 mr-3 text-gray-400" />
                  {employee.phone}
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                  Emp ID: {employee.employeeId}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Banknote className="h-4 w-4 mr-2 text-primary" />
                Payroll & Bank Info
              </h4>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Monthly Salary</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ₹{employee.monthlySalary?.toLocaleString('en-IN') || 0}
                  </p>
                </div>
                
                <div className="border border-gray-100 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Bank Name</p>
                    <p className="text-sm font-medium text-gray-900">{employee.bankName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Account Number</p>
                    <p className="text-sm font-medium text-gray-900">{employee.accountNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">IFSC Code</p>
                    <p className="text-sm font-medium text-gray-900">{employee.ifscCode || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Details & History */}
        <div className="lg:col-span-2 space-y-6">
          <RecentAdvances advances={employee.advances} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
