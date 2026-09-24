// src/ui/SectionHeader.jsx
export default function SectionHeader({ title, action, onAction, className = 'db-section-header' }) {
  return (
    <div className={className}>
      <h3 className="db-section-title">{title}</h3>
      {action && (
        <button className="db-section-action" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
