import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  DollarSign,
  Layers3,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';

const fmtUsd = (n) => {
  const v = Number(n || 0);
  return `${v >= 0 ? '+' : ''}$${v.toFixed(2)}`;
};

const fmtPlainUsd = (n) => `$${Number(n || 0).toFixed(2)}`;
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

const TradingHistory = () => {
  const { quantfuryAnalysis, quantfuryLoading, loading } = useApp();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const data = useMemo(() => {
    if (!quantfuryAnalysis) {
      return {
        summary: null,
        analytics: null,
        round_trips: [],
        raw_legs: [],
      };
    }

    return {
      summary: quantfuryAnalysis.summary ?? null,
      analytics: quantfuryAnalysis.analytics ?? null,
      round_trips: quantfuryAnalysis.round_trips ?? [],
      raw_legs: quantfuryAnalysis.raw_legs ?? [],
    };
  }, [quantfuryAnalysis]);

  const aiJsonPayload = useMemo(() => {
    if (!data.summary) return '';

 const payload = {
  source: 'quantfury',
  generated_at: new Date().toISOString(),
  analysis_goal: 'Evaluar desempeño, riesgo, consistencia, concentración y mejoras operativas',
  summary: data.summary,
  analytics: data.analytics ?? {},
  round_trips: data.round_trips ?? [],
  raw_legs: data.raw_legs ?? [],
};

    return JSON.stringify(payload, null, 2);
  }, [data]);

  const handleCopyJson = async () => {
    if (!aiJsonPayload) return;

    try {
      await navigator.clipboard.writeText(aiJsonPayload);
      setCopied(true);
      setCopyError('');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando JSON:', err);
      setCopyError('No se pudo copiar');
      setCopied(false);
    }
  };

  if (loading || quantfuryLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal" />
      </div>
    );
  }

  if (!data.summary) {
    return (
      <div className="text-center py-20 text-white/40">
        <BarChart3 size={40} className="mx-auto mb-4 opacity-20" />
        <p>No hay análisis disponible.</p>
      </div>
    );
  }

  const summary = data.summary;
  const analytics = data.analytics ?? {};

  const topWinners = analytics.top_winners_symbols ?? [];
  const topLosers = analytics.top_losers_symbols ?? [];
  const bySymbol = analytics.by_symbol ?? [];
  const byAssetType = analytics.by_asset_type ?? [];
  const roundTrips = data.round_trips ?? [];

  const bestTrades = [...roundTrips]
    .filter((t) => Number(t.realized_pnl ?? 0) > 0)
    .sort((a, b) => Number(b.realized_pnl ?? 0) - Number(a.realized_pnl ?? 0))
    .slice(0, 8);

  const worstTrades = [...roundTrips]
    .filter((t) => Number(t.realized_pnl ?? 0) < 0)
    .sort((a, b) => Number(a.realized_pnl ?? 0) - Number(b.realized_pnl ?? 0))
    .slice(0, 8);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-brand-teal" size={24} />
          <div>
            <h1 className="text-2xl font-black">Análisis Quantfury</h1>
            <p className="text-sm text-white/40">Resumen de rendimiento y activos.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyJson}
            disabled={!aiJsonPayload}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar JSON IA'}
          </button>

          {copyError ? (
            <span className="text-xs text-rose-400">{copyError}</span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="PnL neto"
          value={fmtUsd(summary.total_realized_pnl)}
          tone={Number(summary.total_realized_pnl ?? 0) >= 0 ? 'green' : 'red'}
          icon={<DollarSign size={16} />}
        />

        <MetricCard
          title="Win rate"
          value={pct(summary.win_rate)}
          sub={`${summary.winning_trades ?? 0} ganadas · ${summary.losing_trades ?? 0} perdidas`}
          tone="blue"
          icon={<Target size={16} />}
        />

        <MetricCard
          title="Profit factor"
          value={
            summary.profit_factor != null && Number.isFinite(Number(summary.profit_factor))
              ? Number(summary.profit_factor).toFixed(2)
              : '—'
          }
          sub={`Expectancy ${fmtUsd(summary.expectancy)}`}
          tone="neutral"
          icon={<Activity size={16} />}
        />

        <MetricCard
          title="Avg win / loss"
          value={`${fmtUsd(summary.avg_win)} / ${fmtUsd(summary.avg_loss)}`}
          sub={`Gross +${Number(summary.gross_profit ?? 0).toFixed(2)} / -${Math.abs(
            Number(summary.gross_loss ?? 0)
          ).toFixed(2)}`}
          tone="neutral"
          icon={<TrendingUp size={16} />}
        />

        <MetricCard
          title="Ops"
          value={`${summary.total_trades ?? 0}`}
          sub={`${summary.closed_trades ?? 0} cerradas · ${summary.open_trades ?? 0} abiertas`}
          tone="neutral"
          icon={<Layers3 size={16} />}
        />

        <MetricCard
          title="Equity / lev"
          value={fmtPlainUsd(summary.equity_real)}
          sub={`${Number(summary.estimated_leverage ?? 0).toFixed(2)}x`}
          tone="neutral"
          icon={<AlertTriangle size={16} />}
        />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <Panel title="Top ganadores">
          <SimpleRows
            rows={topWinners}
            valueClass="text-emerald-400"
            renderLabel={(row) => row.symbol}
            renderMeta={(row) => {
              const wins = Number(row.winning_legs ?? 0);
              const losses = Number(row.losing_legs ?? 0);
              const total = wins + losses;
              const winRate = total ? (wins / total) * 100 : 0;
              return `${row.closing_legs ?? 0} cierres · WR ${winRate.toFixed(
                0
              )}% · Notional ${fmtPlainUsd(row.total_notional)}`;
            }}
            renderValue={(row) => fmtUsd(row.realized_pnl)}
          />
        </Panel>

        <Panel title="Top perdedores">
          <SimpleRows
            rows={topLosers}
            valueClass="text-rose-400"
            renderLabel={(row) => row.symbol}
            renderMeta={(row) => {
              const wins = Number(row.winning_legs ?? 0);
              const losses = Number(row.losing_legs ?? 0);
              const total = wins + losses;
              const winRate = total ? (wins / total) * 100 : 0;
              return `${row.closing_legs ?? 0} cierres · WR ${winRate.toFixed(
                0
              )}% · Notional ${fmtPlainUsd(row.total_notional)}`;
            }}
            renderValue={(row) => fmtUsd(row.realized_pnl)}
          />
        </Panel>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <Panel title="Mejores trades">
          <TradeRows rows={bestTrades} positive />
        </Panel>

        <Panel title="Peores trades">
          <TradeRows rows={worstTrades} />
        </Panel>
      </div>

      <Panel title="Rendimiento por activo">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bySymbol.slice(0, 12).map((asset) => {
            const wins = Number(asset.winning_legs ?? 0);
            const losses = Number(asset.losing_legs ?? 0);
            const totalClosed = wins + losses;
            const winRate = totalClosed ? (wins / totalClosed) * 100 : 0;
            const closingLegs = Number(asset.closing_legs ?? 0);
            const avgClosingPnl = closingLegs
              ? Number(asset.realized_pnl ?? 0) / closingLegs
              : 0;

            return (
              <div
                key={asset.symbol}
                className="rounded-2xl border border-white/5 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{asset.symbol}</h3>
                    <p className="text-xs text-white/35 uppercase">
                      {asset.asset_type}
                    </p>
                  </div>
                  <p
                    className={`font-black ${
                      Number(asset.realized_pnl ?? 0) >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {fmtUsd(asset.realized_pnl)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MiniStat label="Legs" value={asset.trades ?? 0} />
                  <MiniStat label="Cierres" value={closingLegs} />
                  <MiniStat label="Win rate" value={pct(winRate)} />
                  <MiniStat label="Avg cierre" value={fmtUsd(avgClosingPnl)} />
                  <MiniStat
                    label="Notional"
                    value={fmtPlainUsd(asset.total_notional)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Por clase de activo">
        <div className="grid md:grid-cols-3 gap-4">
          {byAssetType.map((row) => (
            <div
              key={row.assetType}
              className="rounded-2xl border border-white/5 bg-white/5 p-4"
            >
              <p className="text-xs text-white/35 uppercase mb-1">{row.assetType}</p>
              <p
                className={`text-2xl font-black ${
                  Number(row.totalPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {fmtUsd(row.totalPnl)}
              </p>
              <p className="text-sm text-white/45 mt-2">
                {row.legs ?? 0} legs · {row.closingLegs ?? 0} cierres
              </p>
              <p className="text-sm text-white/45">
                Notional {fmtPlainUsd(row.totalNotional)}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

function MetricCard({ title, value, sub, icon, tone = 'neutral' }) {
  const toneMap = {
    green: 'text-emerald-400',
    red: 'text-rose-400',
    blue: 'text-sky-400',
    neutral: 'text-white',
  };

  return (
    <div className="bg-brand-card border border-white/5 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-white/40 mb-2">
        {icon}
        <p className="text-xs uppercase font-bold">{title}</p>
      </div>
      <p className={`text-xl font-black ${toneMap[tone]}`}>{value}</p>
      {sub ? <p className="text-[11px] text-white/30 mt-2">{sub}</p> : null}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="bg-brand-card border border-white/5 rounded-2xl p-5">
      <h2 className="font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SimpleRows({ rows, renderLabel, renderMeta, renderValue, valueClass = 'text-white' }) {
  if (!rows.length) return <p className="text-sm text-white/40">Sin datos.</p>;

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div key={`${row.symbol}-${idx}`} className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{renderLabel(row)}</p>
            <p className="text-xs text-white/35">{renderMeta(row)}</p>
          </div>
          <p className={`font-bold ${valueClass}`}>{renderValue(row)}</p>
        </div>
      ))}
    </div>
  );
}

function TradeRows({ rows, positive = false }) {
  if (!rows.length) return <p className="text-sm text-white/40">Sin datos.</p>;

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => {
        const pnl = Number(row.realized_pnl ?? 0);
        return (
          <div
            key={`${row.symbol || 'trade'}-${idx}`}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold">{row.symbol || 'Trade'}</p>
              <p className="text-xs text-white/35">
                {row.open_date || '—'} {row.open_time || ''} → {row.close_date || '—'}{' '}
                {row.close_time || ''}
              </p>
            </div>
            <p className={`font-bold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmtUsd(pnl)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-white/35 uppercase">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

export default TradingHistory;