import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { LogIn } from 'lucide-react';

const schema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched', // Validate on blur for real-time feedback
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const success = await login(data.email, data.password);
    setLoading(false);
    
    if (success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Sign in to your account</h3>
        <p className="text-sm text-gray-500 mt-1">Enter your email and password to access the dashboard.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@yourorg.com"
          required
          {...register('email')}
          error={errors.email}
          success={touchedFields.email && !errors.email && dirtyFields.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          {...register('password')}
          error={errors.password}
          success={touchedFields.password && !errors.password && dirtyFields.password}
          autoComplete="current-password"
        />

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          icon={!loading && <LogIn size={18} />}
        >
          Sign In
        </Button>
      </form>
    </div>
  );
};

export default Login;
