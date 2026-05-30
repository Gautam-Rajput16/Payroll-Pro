import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const Select = React.forwardRef(({ label, error, success, required, options = [], className = '', id, ...props }, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success) && !hasError;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200 appearance-none pr-10
            ${hasError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
              : hasSuccess
                ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                : 'border-gray-300 focus:border-primary focus:ring-primary/20'
            }`}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${selectId}-error` : undefined}
          {...props}
        >
          {options.map((option, idx) => (
            <option key={idx} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Dropdown arrow or status icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {hasError ? (
            <AlertCircle size={16} className="text-red-500" />
          ) : hasSuccess ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : (
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {hasError && (
        <p id={`${selectId}-error`} className="mt-1.5 text-xs text-red-500 flex items-center gap-1 animate-[slideDown_0.2s_ease-out]" role="alert">
          {error.message || error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
