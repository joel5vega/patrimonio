import { useState } from 'react';

export function usePortfolioExport(report) {
  const [copied, setCopied] = useState(false);

  const serialize = () => JSON.stringify(report || {}, null, 2);

  const copy = async () => {
    if (!report || !navigator.clipboard) return false;
    await navigator.clipboard.writeText(serialize());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
    return true;
  };

  const download = () => {
    if (!report) return false;
    const blob = new Blob([serialize()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = report.snapshot?.asOfDate || 'analysis';
    anchor.href = url;
    anchor.download = `portfolio-ai-${date}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return true;
  };

  return { copied, copy, download };
}