export function FormField({
  label,
  name,
  error,
  required,
  help,
  children,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm text-text mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {children}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {help && !error && (
        <p className="mt-1 text-sm text-text/60">{help}</p>
      )}
    </div>
  );
}