// src/pages/Dashboard/components/IdeasSection.jsx
import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SectionHeader from '../../../ui/SectionHeader';

const MarkdownCard = ({ title, subtitle, markdown }) => {
  const [expanded, setExpanded] = useState(false);
  if (!markdown) return null;

  return (
    <div className="db-md-card">
      <div className="db-md-header">
        <span
          className="db-md-badge"
          style={{
            color: 'var(--color-accent-cyan)',
            borderColor: 'color-mix(in srgb, var(--color-accent-cyan) 27%, transparent)',
            background: 'color-mix(in srgb, var(--color-accent-cyan) 8%, transparent)',
          }}
        >
          <FileText size={11} strokeWidth={2.5} /> Idea
        </span>
        <h3 className="db-md-title">{title}</h3>
        <p className="db-md-subtitle">{subtitle}</p>
      </div>
      <div className={`db-md-body ${!expanded ? 'db-md-body--collapsed' : ''}`}>
        <ReactMarkdown>{markdown}</ReactMarkdown>
        {!expanded && <div className="db-md-fade" />}
      </div>
      <button className="db-md-toggle" onClick={() => setExpanded((v) => !v)}>
        {expanded ? <><ChevronUp size={13} /> Colapsar</> : <><ChevronDown size={13} /> Expandir</>}
      </button>
    </div>
  );
};

export default function IdeasSection({ loading, ideas }) {
  if (loading || !ideas?.length) return null;

  return (
    <div className="db-section">
      <SectionHeader title="Ideas" />
      <div className="db-cards-list">
        {ideas.map((idea, i) => (
          <MarkdownCard
            key={idea.id ?? i}
            title={idea.title || idea.symbol || 'Sin título'}
            subtitle={idea.subtitle || idea.ticker || ''}
            markdown={idea.markdown || idea.content || idea.notes}
          />
        ))}
      </div>
    </div>
  );
}
