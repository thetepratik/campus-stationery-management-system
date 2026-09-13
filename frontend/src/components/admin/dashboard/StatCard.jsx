const StatCard = ({ icon: Icon, label, value, color = 'primary' }) => {
  return (
    <div className="card card--hoverable stat-card">
      <div
        className="stat-card__icon"
        style={{
          background: `var(--color-${color}-light)`,
          color: `var(--color-${color})`,
        }}
      >
        <Icon />
      </div>
      <div>
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
      </div>
    </div>
  );
};

export default StatCard;
