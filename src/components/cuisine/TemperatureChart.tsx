import { useState } from 'react';
import {
  DEMO_CHART,
  formatTemp,
  type ChartDataset,
  type ChartPeriod,
} from '@/lib/demoTemperatures';

const PERIODS: ChartPeriod[] = ['24h', '7j', '30j'];

// Géométrie du SVG (viewBox 0 0 700 220, comme la maquette)
const X_START = 40;
const X_END = 700;
const Y_TOP = 40; // 6 °C
const Y_BOTTOM = 190; // 0 °C
const TEMP_MAX = 6;

function yFor(temp: number): number {
  const clamped = Math.min(Math.max(temp, 0), TEMP_MAX);
  return Y_BOTTOM - (clamped / TEMP_MAX) * (Y_BOTTOM - Y_TOP);
}

function xFor(index: number, count: number): number {
  if (count <= 1) return X_START;
  return X_START + (index * (X_END - X_START)) / (count - 1);
}

function linePath(points: number[]): string {
  return points
    .map(
      (t, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i, points.length).toFixed(1)} ${yFor(t).toFixed(1)}`,
    )
    .join(' ');
}

interface Stats {
  min: number;
  max: number;
  moyenne: number;
  depassements: number;
}

function computeStats(dataset: ChartDataset): Stats {
  const { points } = dataset;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const moyenne = points.reduce((sum, t) => sum + t, 0) / points.length;
  const depassements = points.filter((t) => t < 0 || t > TEMP_MAX).length;
  return { min, max, moyenne, depassements };
}

/**
 * Graphique d'évolution des températures (façon maquette PMS_04) —
 * données simulées du « Frigo positif 1 », onglets 24h / 7 jours / 30 jours.
 */
export function TemperatureChart() {
  const [period, setPeriod] = useState<ChartPeriod>('7j');
  const dataset = DEMO_CHART[period];
  const stats = computeStats(dataset);
  const areaPath = `${linePath(dataset.points)} L ${X_END} 220 L ${X_START} 220 Z`;
  const lastIndex = dataset.points.length - 1;
  const lastPoint = dataset.points[lastIndex];

  return (
    <div className="bg-surface rounded-card border border-gray-200 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-brand-darker text-sm font-bold">Évolution — Frigo positif 1</h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                p === period
                  ? 'bg-brand-soft text-brand-darker'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {p === '7j' ? '7 jours' : p === '30j' ? '30 jours' : '24h'}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 700 220" preserveAspectRatio="none" className="h-48 w-full" role="img">
        <title>Températures simulées du Frigo positif 1 sur {dataset.statsLabel}</title>
        {/* grille + labels °C */}
        {[
          { y: Y_TOP, label: '6 °C' },
          { y: 90, label: '4 °C' },
          { y: 140, label: '2 °C' },
          { y: Y_BOTTOM, label: '0 °C' },
        ].map(({ y, label }) => (
          <g key={y}>
            <line x1="0" y1={y} x2={X_END} y2={y} className="stroke-gray-100" />
            <text x="6" y={y + 4} fontSize="10" className="fill-gray-400">
              {label}
            </text>
          </g>
        ))}
        {/* zone cible 0–6 °C */}
        <rect
          x={X_START}
          y={Y_TOP}
          width={X_END - X_START}
          height={Y_BOTTOM - Y_TOP}
          className="text-brand-soft fill-current"
          opacity="0.4"
        />
        {/* aire sous la courbe + courbe */}
        <path d={areaPath} className="text-brand fill-current" opacity="0.15" />
        <path
          d={linePath(dataset.points)}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-brand stroke-current"
        />
        {lastPoint !== undefined && (
          <circle
            cx={xFor(lastIndex, dataset.points.length)}
            cy={yFor(lastPoint)}
            r="4"
            className="text-brand fill-current"
          />
        )}
        {/* labels axe X */}
        {dataset.labels.map((label, i) => (
          <text
            key={label}
            x={xFor(i, dataset.labels.length)}
            y="215"
            fontSize="10"
            textAnchor="middle"
            className="fill-gray-400"
          >
            {label}
          </text>
        ))}
      </svg>

      <div className="mt-3 flex justify-between border-t border-gray-100 pt-3">
        {[
          { label: `Min ${dataset.statsLabel}`, value: `${formatTemp(stats.min)} °C` },
          { label: `Max ${dataset.statsLabel}`, value: `${formatTemp(stats.max)} °C` },
          { label: 'Moyenne', value: `${formatTemp(stats.moyenne)} °C` },
          { label: 'Dépassements', value: String(stats.depassements) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs text-gray-400">{label}</div>
            <div className="text-brand-darker text-sm font-semibold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
