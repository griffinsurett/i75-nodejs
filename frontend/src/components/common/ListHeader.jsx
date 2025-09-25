// frontend/src/components/common/ListHeader.jsx
export default function ListHeader({
  title,
  count,
  icon: Icon,
  tabs,
  actions,
  className = ""
}) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-heading flex items-center">
          {Icon && <Icon className="w-6 h-6 mr-2" />}
          {title} {count !== undefined && `(${count})`}
        </h2>
        {tabs}
      </div>
      {actions}
    </div>
  );
}