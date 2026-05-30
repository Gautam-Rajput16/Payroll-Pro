import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const Textarea = React.forwardRef(({ label, error, success, required, className = '', id, rows = 3, maxLength, ...props }, ref) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success) && !hasError;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          maxLength={maxLength}
          className={`flex w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200 resize-y
            ${hasError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/30'
              : hasSuccess
                ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                : 'border-gray-300 focus:border-primary focus:ring-primary/20'
            }`}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${textareaId}-error` : undefined}
          {...props}
        />
        {/* Status icon top-right */}
        {(hasError || hasSuccess) && (
          <div className="absolute right-3 top-3">
            {hasError ? (
              <AlertCircle size={16} className="text-red-500" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-500" />
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between mt-1.5">
        {hasError ? (
          <p id={`${textareaId}-error`} className="text-xs text-red-500 flex items-center gap-1 animate-[slideDown_0.2s_ease-out]" role="alert">
            {error.message || error}
          </p>
        ) : <span />}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
