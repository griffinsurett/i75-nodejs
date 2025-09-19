// frontend/src/components/search/SearchInput.jsx
import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  disabled = false,
  showClearButton = true,
  autoFocus = false,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'outlined', 'filled'
}) {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-4 py-3 text-base',
  };

  const variantClasses = {
    default: 'bg-bg border border-border-primary focus:ring-2 focus:ring-primary',
    outlined: 'bg-transparent border-2 border-border-primary focus:border-primary',
    filled: 'bg-bg border-0 focus:ring-2 focus:ring-primary',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  const leftPadding = {
    small: 'pl-9',
    medium: 'pl-10',
    large: 'pl-12',
  };

  const rightPadding = showClearButton && value ? {
    small: 'pr-9',
    medium: 'pr-10',
    large: 'pr-12',
  } : {};

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <Search 
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconSizes[size]} text-text/50`} 
      />
      
      {/* Search Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`
          w-full rounded-lg focus:outline-none transition-colors
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${leftPadding[size]}
          ${rightPadding[size] || ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      
      {/* Clear Button */}
      {showClearButton && value && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className={`
            absolute right-3 top-1/2 -translate-y-1/2 
            text-text/50 hover:text-text transition-colors
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <X className={iconSizes[size]} />
        </button>
      )}
    </div>
  );
}