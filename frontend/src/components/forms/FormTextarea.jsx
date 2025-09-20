import { forwardRef } from 'react';

export const FormTextarea = forwardRef(({
  error,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`
        w-full rounded-lg border px-3 py-2 text-sm min-h-24
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

FormTextarea.displayName = 'FormTextarea';