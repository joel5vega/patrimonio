import { INVESTOR_PROFILES } from '../utils/portfolioAnalysis';

const ORDER = ['defensivo', 'moderado', 'crecimiento', 'agresivo', 'personalizado'];

export default function PortfolioProfileSelector({ value, onChange }) {
  return (
    <div className="portfolio-profile-selector">
      {ORDER.map((key) => {
        const profile = INVESTOR_PROFILES[key];
        if (!profile) return null;
        const active = value === key;

        return (
          <button
            key={key}
            type="button"
            className={`portfolio-profile-pill ${active ? 'active' : ''}`}
            onClick={() => onChange(key)}
          >
            {profile.label}
          </button>
        );
      })}
    </div>
  );
}