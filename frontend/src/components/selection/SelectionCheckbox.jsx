import { Check } from 'lucide-react';

export default function SelectionCheckbox({ 
  isSelected, 
  onToggle,
  variant = "default",
  className = "" 
}) {
  const variants = {
    default: {
      container: `w-6 h-6 rounded border-2 flex items-center justify-center ${
        isSelected 
          ? 'bg-primary border-primary' 
          : 'bg-white/90 border-gray-400 hover:border-primary'
      }`,
      check: "w-4 h-4 text-white"
    },
    small: {
      container: `w-4 h-4 rounded border ${
        isSelected 
          ? 'bg-primary border-primary' 
          : 'bg-white/90 border-gray-400 hover:border-primary'
      }`,
      check: "w-3 h-3 text-white"
    },
    large: {
      container: `w-8 h-8 rounded-md border-2 flex items-center justify-center ${
        isSelected 
          ? 'bg-primary border-primary' 
          : 'bg-white/90 border-gray-400 hover:border-primary'
      }`,
      check: "w-5 h-5 text-white"
    }
  };

  const style = variants[variant] || variants.default;

  return (
    <div 
      className={`${style.container} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {isSelected && <Check className={style.check} />}
    </div>
  );
}