// frontend/src/components/common/StatsGrid.jsx
export default function StatsGrid({ stats, className = "" }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-center ${className}`}>
      {stats.map((stat, index) => (
        <div key={index}>
          <div className="text-lg font-bold text-primary">{stat.value}</div>
          <div className="text-xs text-text/60">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}