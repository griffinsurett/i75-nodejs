import { forwardRef } from 'react';

export const FormSelect = forwardRef(({
  options = [],
  placeholder = 'Select...',
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <select
      ref={ref}
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
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((option) => {
        const value = option.value ?? option;
        const label = option.label ?? option;
        const key = option.key ?? value;
        
        return (
          <option key={key} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
});

FormSelect.displayName = 'FormSelect';