import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent } from '../../components/ui/Card';
import axiosInstance from '../../api/axiosInstance';

const schema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Organisation name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  contactEmail: yup
    .string()
    .trim()
    .email('Please enter a valid email address')
    .required('Contact email is required'),
  address: yup
    .string()
    .trim()
    .max(250, 'Address must be less than 250 characters'),
  taxId: yup
    .string()
    .trim()
    .max(30, 'Tax ID must be less than 30 characters'),
});

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      name: user?.organizationId?.name || user?.organizationName || '',
      address: '123 Business Avenue, Tech Park',
      contactEmail: user?.email || '',
      taxId: 'TAX987654321',
    }
  });

  const handleOrgUpdate = async (data) => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Organisation settings updated successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your organisation profile and system preferences.</p>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">Organisation Profile</h3>
        </div>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(handleOrgUpdate)} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Organisation Name" 
                required
                {...register('name')}
                error={errors.name}
                success={touchedFields.name && !errors.name && dirtyFields.name}
              />
              <Input 
                label="Tax ID / Registration Number" 
                {...register('taxId')}
                error={errors.taxId}
                success={touchedFields.taxId && !errors.taxId && dirtyFields.taxId}
              />
              <Input 
                label="Contact Email" 
                type="email"
                required
                {...register('contactEmail')}
                error={errors.contactEmail}
                success={touchedFields.contactEmail && !errors.contactEmail && dirtyFields.contactEmail}
              />
              <Input 
                label="Business Address" 
                {...register('address')}
                error={errors.address}
                success={touchedFields.address && !errors.address && dirtyFields.address}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" loading={loading} icon={!loading && <Save size={18} />}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">Security</h3>
        </div>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600 mb-4">
            Need to update your password? You can change it securely here.
          </p>
          <Button variant="secondary" onClick={() => navigate('/change-password')}>
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
