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
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Card, { CardContent } from '../../components/ui/Card';
import { FullPageSpinner } from '../../components/ui/Spinner';

const schema = yup.object().shape({
  employeeId: yup
    .string()
    .required('Please select an employee'),
  amount: yup
    .number()
    .typeError('Amount must be a number')
    .positive('Amount must be greater than zero')
    .min(100, 'Minimum advance amount is ₹100')
    .max(500000, 'Maximum advance amount is ₹5,00,000')
    .required('Amount is required'),
  date: yup
    .string()
    .required('Date is required'),
  reason: yup
    .string()
    .trim()
    .required('Reason is required')
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason must be less than 500 characters'),
  status: yup
    .string()
    .required('Status is required'),
});

const AdvanceForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [employees, setEmployees] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch employees for the dropdown
        const empRes = await axiosInstance.get('/admin/employees?limit=100');
        const allEmployees = Array.isArray(empRes.data.data) ? empRes.data.data : [];
        const activeEmployees = allEmployees
          .filter(emp => emp.status === 'Active')
          .map(emp => ({ value: emp._id, label: `${emp.name} (${emp.employeeId})` }));
        
        setEmployees(activeEmployees);

        // If edit mode, fetch the advance
        if (isEdit) {
          const advRes = await axiosInstance.get(`/admin/advances/${id}`);
          const adv = advRes.data.data;
          
          if (adv.date) {
            adv.date = new Date(adv.date).toISOString().split('T')[0];
          }
          
          // Flatten the employeeId for the select
          if (adv.employeeId && adv.employeeId._id) {
            adv.employeeId = adv.employeeId._id;
          }
          
          reset(adv);
        }
      } catch (error) {
        toast.error('Failed to load required data');
        navigate('/advances');
      } finally {
        setFetching(false);
      }
    };
    
    fetchInitialData();
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await axiosInstance.put(`/admin/advances/${id}`, data);
        toast.success('Advance updated successfully');
      } else {
        await axiosInstance.post('/admin/advances', data);
        toast.success('Advance granted successfully');
      }
      navigate('/advances');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save advance');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <FullPageSpinner />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/advances')}
          className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full border border-gray-200 shadow-sm transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Advance' : 'Grant New Advance'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isEdit ? 'Update advance details.' : 'Grant a salary advance to an employee.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardContent className="space-y-6 pt-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Employee"
                required
                {...register('employeeId')}
                error={errors.employeeId}
                success={touchedFields.employeeId && !errors.employeeId && dirtyFields.employeeId}
                options={[
                  { value: '', label: 'Select Employee' },
                  ...employees
                ]}
                disabled={isEdit}
              />
              <Input
                label="Amount (₹)"
                type="number"
                placeholder="5000"
                required
                {...register('amount')}
                error={errors.amount}
                success={touchedFields.amount && !errors.amount && dirtyFields.amount}
              />
              <Input
                label="Date"
                type="date"
                required
                {...register('date')}
                error={errors.date}
                success={touchedFields.date && !errors.date && dirtyFields.date}
              />
              <Select
                label="Status"
                required
                {...register('status')}
                error={errors.status}
                success={touchedFields.status && !errors.status && dirtyFields.status}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Paid', label: 'Paid (Active)' },
                  { value: 'Deducted', label: 'Deducted (Recovered)' },
                ]}
              />
            </div>

            <Textarea
              label="Reason for Advance"
              placeholder="Medical emergency, home repair, etc."
              required
              maxLength={500}
              {...register('reason')}
              error={errors.reason}
              success={touchedFields.reason && !errors.reason && dirtyFields.reason}
              rows={4}
            />

          </CardContent>
          
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
            <Button variant="secondary" onClick={() => navigate('/advances')} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={loading} icon={!loading && <Save size={18} />}>
              {isEdit ? 'Update Advance' : 'Grant Advance'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default AdvanceForm;
