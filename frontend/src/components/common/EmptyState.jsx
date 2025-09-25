// frontend/src/components/common/EmptyState.jsx
export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = "" 
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && <Icon className="w-12 h-12 mx-auto text-text/40 mb-4" />}
      <h3 className="text-lg font-medium text-heading mb-2">{title}</h3>
      {description && <p className="text-text mb-4">{description}</p>}
      {action}
    </div>
  );
}