import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(
  ({ className = '', variant = 'primary', size = 'md', loading = false, icon, children, disabled, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
      secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm',
      danger: 'bg-danger text-white hover:bg-red-600 shadow-sm',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    };
    
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 py-3 text-base',
    };
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
