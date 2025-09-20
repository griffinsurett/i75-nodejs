import { forwardRef } from 'react';

export const FormInput = forwardRef(({
  type = 'text',
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={`
        w-full rounded-lg border px-3 py-2 text-sm 
        focus:outline-none focus:ring-2 focus:ring-primary
        ${error 
          ? 'border-red-500 focus:ring-red-500' 
          : 'border-border-primary bg-bg2'
        }
        ${className}
      `}
      {...props}
    />
  );
});

FormInput.displayName = 'FormInput';