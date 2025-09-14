const StatCard = ({ label, value }) => (
  <div>
    <div className="text-2xl font-bold text-primary">{value}</div>
    <div className="text-sm text-text">{label}</div>
  </div>
);

export default StatCard;