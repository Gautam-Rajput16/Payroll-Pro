import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Save } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent } from '../../components/ui/Card';
import { FullPageSpinner } from '../../components/ui/Spinner';

const schema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Employee name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be less than 60 characters')
    .matches(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, dots, hyphens'),
  phone: yup
    .string()
    .trim()
    .required('Phone number is required')
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  monthlySalary: yup
    .number()
    .typeError('Salary must be a number')
    .positive('Salary must be a positive amount')
    .min(1000, 'Minimum salary is ₹1,000')
    .max(10000000, 'Maximum salary is ₹1,00,00,000')
    .required('Monthly salary is required'),
  bankName: yup
    .string()
    .trim()
    .required('Bank name is required')
    .min(2, 'Bank name must be at least 2 characters')
    .max(100, 'Bank name is too long'),
  accountNumber: yup
    .string()
    .trim()
    .required('Account number is required')
    .matches(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
  ifscCode: yup
    .string()
    .trim()
    .required('IFSC code is required')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code (e.g., SBIN0001234)'),
});

const EmployeeForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isEdit) {
      const fetchEmployee = async () => {
        try {
          const res = await axiosInstance.get(`/admin/employees/${id}`);
          const emp = res.data.data;
          reset(emp);
        } catch (error) {
          toast.error('Failed to fetch employee details');
          navigate('/employees');
        } finally {
          setFetching(false);
        }
      };
      
      fetchEmployee();
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await axiosInstance.put(`/admin/employees/${id}`, data);
        toast.success('Employee updated successfully');
      } else {
        await axiosInstance.post('/admin/employees', data);
        toast.success('Employee created successfully');
      }
      navigate('/employees');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <FullPageSpinner />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/employees')}
            className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full border border-gray-200 shadow-sm transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {isEdit ? 'Update employee details.' : 'Enter details to onboard a new employee.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardContent className="space-y-8 pt-6">
            
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  required
                  {...register('name')}
                  error={errors.name}
                  success={touchedFields.name && !errors.name && dirtyFields.name}
                />
                <Input
                  label="Phone Number"
                  placeholder="9876543210"
                  required
                  maxLength={10}
                  {...register('phone')}
                  error={errors.phone}
                  success={touchedFields.phone && !errors.phone && dirtyFields.phone}
                />
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Bank Name"
                  placeholder="State Bank of India"
                  required
                  {...register('bankName')}
                  error={errors.bankName}
                  success={touchedFields.bankName && !errors.bankName && dirtyFields.bankName}
                />
                <Input
                  label="Account Number"
                  placeholder="1234567890"
                  required
                  maxLength={18}
                  {...register('accountNumber')}
                  error={errors.accountNumber}
                  success={touchedFields.accountNumber && !errors.accountNumber && dirtyFields.accountNumber}
                />
                <Input
                  label="IFSC Code"
                  placeholder="SBIN0001234"
                  required
                  maxLength={11}
                  {...register('ifscCode')}
                  error={errors.ifscCode}
                  success={touchedFields.ifscCode && !errors.ifscCode && dirtyFields.ifscCode}
                />
              </div>
            </div>

            {/* Salary */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Salary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Monthly Salary (₹)"
                  type="number"
                  placeholder="50000"
                  required
                  {...register('monthlySalary')}
                  error={errors.monthlySalary}
                  success={touchedFields.monthlySalary && !errors.monthlySalary && dirtyFields.monthlySalary}
                />
              </div>
            </div>

          </CardContent>
          
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
            <Button variant="secondary" onClick={() => navigate('/employees')} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={loading} icon={!loading && <Save size={18} />}>
              {isEdit ? 'Update Employee' : 'Save Employee'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default EmployeeForm;
