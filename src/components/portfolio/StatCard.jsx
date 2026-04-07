const StatCard = ({ label, value, tone }) => (
  <div className="portfolio-stat-card">
    <p className="portfolio-stat-label">{label}</p>
    <p className={`portfolio-stat-value ${tone || ''}`}>{value}</p>
  </div>
);

export default StatCard;