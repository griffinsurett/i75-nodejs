// frontend/src/components/common/NumberBadge.jsx
export default function NumberBadge({ 
  number, 
  variant = 'default',
  size = 'sm',
  className = '' 
}) {
  const variants = {
    default: 'bg-bg2 text-text',
    primary: 'bg-primary text-white',
    danger: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    success: 'bg-green-600 text-white'
  };

  const sizes = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  return (
    <div className={`
      rounded flex items-center justify-center font-medium flex-shrink-0
      ${variants[variant]} 
      ${sizes[size]}
      ${className}
    `}>
      {number}
    </div>
  );
}