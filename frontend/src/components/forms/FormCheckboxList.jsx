export function FormCheckboxList({
  options = [],
  value = [],
  onChange,
  name,
  label,
  error,
  className = '',
  emptyText = 'No options available',
}) {
  const handleToggle = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onChange(newValue);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-text mb-2">{label}</label>
      )}
      
      <div className="max-h-40 overflow-auto rounded-lg border border-border-primary p-2 bg-bg2">
        {options.length === 0 ? (
          <p className="text-xs text-text/70 px-1">{emptyText}</p>
        ) : (
          <ul className="space-y-1">
            {options.map((option) => {
              const optionValue = option.value ?? option.id ?? option;
              const optionLabel = option.label ?? option.name ?? option;
              const optionKey = option.key ?? optionValue;
              
              return (
                <li key={optionKey} className="flex items-center gap-2">
                  <input
                    id={`${name}-${optionKey}`}
                    type="checkbox"
                    className="accent-primary"
                    checked={value.includes(optionValue)}
                    onChange={() => handleToggle(optionValue)}
                  />
                  <label
                    htmlFor={`${name}-${optionKey}`}
                    className="text-sm text-text cursor-pointer"
                  >
                    {optionLabel}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}