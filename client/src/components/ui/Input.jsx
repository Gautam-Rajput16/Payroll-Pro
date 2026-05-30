import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const Input = React.forwardRef(({ label, error, success, required, className = '', id, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success) && !hasError;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200 pr-10
            ${hasError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
              : hasSuccess
                ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                : 'border-gray-300 focus:border-primary focus:ring-primary/20'
            }`}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          {...props}
        />
        {/* Status Icons */}
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-[shake_0.3s_ease-in-out]">
            <AlertCircle size={16} />
          </div>
        )}
        {hasSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-[fadeIn_0.2s_ease-in]">
            <CheckCircle2 size={16} />
          </div>
        )}
      </div>
      {hasError && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-500 flex items-center gap-1 animate-[slideDown_0.2s_ease-out]" role="alert">
          {error.message || error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
