import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ShieldCheck } from 'lucide-react';

const schema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .matches(/[@$!%*?&#]/, 'Must contain at least one special character (@$!%*?&#)'),
  confirmPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword'), null], 'Passwords do not match'),
});

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const success = await changePassword(data.currentPassword, data.newPassword);
    setLoading(false);
    
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Change Password Required</h3>
        <p className="text-sm text-gray-500 mt-1">
          For security reasons, you must change your password upon first login.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Current Password"
          type="password"
          placeholder="••••••••"
          required
          {...register('currentPassword')}
          error={errors.currentPassword}
          success={touchedFields.currentPassword && !errors.currentPassword && dirtyFields.currentPassword}
        />

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          required
          {...register('newPassword')}
          error={errors.newPassword}
          success={touchedFields.newPassword && !errors.newPassword && dirtyFields.newPassword}
        />
        
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          required
          {...register('confirmPassword')}
          error={errors.confirmPassword}
          success={touchedFields.confirmPassword && !errors.confirmPassword && dirtyFields.confirmPassword}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          loading={loading}
          icon={!loading && <ShieldCheck size={18} />}
        >
          Update Password
        </Button>
      </form>
    </div>
  );
};

export default ChangePassword;
