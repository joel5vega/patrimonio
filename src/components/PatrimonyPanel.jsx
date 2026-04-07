// src/components/PatrimonyPanel.jsx
const fmt = (v=0,d=0) => '$'+Number(v??0).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g,',');

const PatrimonyPanel = ({ patrimony }) => {
  if (!patrimony || patrimony.totalUSD <= 0) return null;
  const { totalUSD, byClass, assets } = patrimony;
  return (
    <div className="patrimony-grid">
      <div className="patrimony-summary">
        <span className="patrimony-label">Total patrimonio</span>
        <span className="patrimony-value">{fmt(totalUSD)}</span>
      </div>
      <div className="patrimony-items">
        {(assets||[]).map((a,i) => (
          <div key={i} className="patrimony-item">
            <span className="patrimony-item-name">{a.name}</span>
            <span className="patrimony-item-class">{a.classification?.assetClass}</span>
            <span className="patrimony-item-value">{fmt(a.valueUSD)}</span>
          </div>
        ))}
      </div>
      {byClass && Object.keys(byClass).length > 0 && (
        <div className="patrimony-classes">
          {Object.entries(byClass).map(([cls,val]) => (
            <div key={cls} className="patrimony-class-row">
              <span className="patrimony-class-name">{cls}</span>
              <span className="patrimony-class-pct">
                {totalUSD>0 ? (val/totalUSD*100).toFixed(1) : 0}%
              </span>
              <span className="patrimony-class-val">{fmt(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatrimonyPanel;
