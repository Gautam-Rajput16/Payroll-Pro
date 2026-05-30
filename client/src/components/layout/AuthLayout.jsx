import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white font-bold text-xl">
            P
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            PayrollPro
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enterprise Admin Portal
          </p>
        </div>
        <div className="bg-white px-8 py-8 shadow-sm sm:rounded-xl border border-gray-200">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
