import React, { useState, useEffect } from 'react';
import './Harvest.css';
import { Clock, TrendingUp, Droplets, Zap, Leaf as LeafIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

/* ── Demo / fallback data ───────────────────────────────────── */
const DEMO_HARVEST = [
  {
    crop: 'Lettuce',
    zone: 'Zone A · Rack 1-3',
    days_elapsed: 22,
    days_remaining: 5,
    health_score: 88,
    health_history: [95, 92, 88, 91, 85, 78, 90, 88, 92, 89, 88, 87, 89, 88, 90, 88, 87, 89, 88, 89, 90, 88],
    base_yield_kg: 2.5,
    progress: 81,
  },
  {
    crop: 'Spinach',
    zone: 'Zone B · Rack 4-5',
    days_elapsed: 18,
    days_remaining: 22,
    health_score: 71,
    health_history: [90, 85, 80, 75, 70, 68, 72, 71, 73, 70, 69, 71, 72, 71, 70, 72, 71, 70],
    base_yield_kg: 1.8,
    progress: 45,
  },
  {
    crop: 'Basil',
    zone: 'Zone C · Rack 6',
    days_elapsed: 7,
    days_remaining: 27,
    health_score: 91,
    health_history: [95, 94, 96, 92, 93, 91, 91],
    base_yield_kg: 1.2,
    progress: 20,
  },
  {
    crop: 'Kangkung',
    zone: 'Zone D · Rack 7-8',
    days_elapsed: 31,
    days_remaining: 2,
    health_score: 82,
    health_history: Array(31).fill(82),
    base_yield_kg: 2.0,
    progress: 94,
  },
];

const CROP_EMOJI = { Lettuce: '🥬', Spinach: '🌿', Basil: '🌱', Kangkung: '🥗' };

/* ── Stage thresholds & tips ────────────────────────────────── */
const STAGE_THRESHOLDS = {
  Lettuce: [
    { name: 'Germination', emoji: '🌰', dayStart: 0,  dayEnd: 3,  desc: 'Seeds sprouting, keep moisture high' },
    { name: 'Seedling',    emoji: '🌱', dayStart: 4,  dayEnd: 8,  desc: 'First true leaves, increase light gradually' },
    { name: 'Vegetative',  emoji: '🌿', dayStart: 9,  dayEnd: 20, desc: 'Rapid leaf growth, high nutrient demand' },
    { name: 'Pre-Harvest', emoji: '🍃', dayStart: 21, dayEnd: 26, desc: 'Reduce nutrients, begin water flush' },
    { name: 'Ready',       emoji: '🥬', dayStart: 27, dayEnd: 99, desc: 'Harvest now for peak freshness' },
  ],
  Spinach: [
    { name: 'Germination', emoji: '🌰', dayStart: 0,  dayEnd: 5,  desc: 'Seeds sprouting, maintain 70% humidity' },
    { name: 'Seedling',    emoji: '🌱', dayStart: 6,  dayEnd: 12, desc: 'Cotyledons emerging, gentle airflow' },
    { name: 'Vegetative',  emoji: '🌿', dayStart: 13, dayEnd: 30, desc: 'Leaf expansion phase, peak EC needed' },
    { name: 'Pre-Harvest', emoji: '🍃', dayStart: 31, dayEnd: 38, desc: 'Reduce EC, increase blue light ratio' },
    { name: 'Ready',       emoji: '🌿', dayStart: 39, dayEnd: 99, desc: 'Harvest at peak nutritional value' },
  ],
  Basil: [
    { name: 'Germination', emoji: '🌰', dayStart: 0,  dayEnd: 4,  desc: 'Warmth critical, 25°C minimum' },
    { name: 'Seedling',    emoji: '🌱', dayStart: 5,  dayEnd: 10, desc: 'Avoid overwatering, good drainage' },
    { name: 'Vegetative',  emoji: '🌿', dayStart: 11, dayEnd: 25, desc: 'Pinch early flowers to boost leaf yield' },
    { name: 'Pre-Harvest', emoji: '🍃', dayStart: 26, dayEnd: 33, desc: 'Harvest before flowering for best flavour' },
    { name: 'Ready',       emoji: '🌱', dayStart: 34, dayEnd: 99, desc: 'Harvest top leaves, plant will regrow' },
  ],
  Kangkung: [
    { name: 'Germination', emoji: '🌰', dayStart: 0,  dayEnd: 3,  desc: 'Seeds swell in warm water, 28°C ideal' },
    { name: 'Seedling',    emoji: '🌱', dayStart: 4,  dayEnd: 9,  desc: 'Thin shoots appearing, maintain moisture' },
    { name: 'Vegetative',  emoji: '🌿', dayStart: 10, dayEnd: 22, desc: 'Rapid vine growth, heavy feeder phase' },
    { name: 'Pre-Harvest', emoji: '🍃', dayStart: 23, dayEnd: 28, desc: 'Cut top 30cm, plant regenerates quickly' },
    { name: 'Ready',       emoji: '🥗', dayStart: 29, dayEnd: 99, desc: 'Harvest young tips for tenderness' },
  ],
};

const STAGE_TIPS = {
  Germination:  'Maintain humidity above 75% and keep temperature at 22–25°C.',
  Seedling:     'Gradually increase light intensity, avoid direct strong airflow.',
  Vegetative:   'This is peak growth — ensure pH stays 5.5–6.5 and EC at 1200–1600.',
  'Pre-Harvest':'Flush with plain water to reduce nutrient residue in leaves.',
  Ready:        'Harvest in the early morning for maximum freshness and shelf life.',
};

const STAGE_NAMES = ['Germination', 'Seedling', 'Vegetative', 'Pre-Harvest', 'Ready'];

function getCurrentStageIndex(cropName, daysElapsed) {
  const stages = STAGE_THRESHOLDS[cropName];
  if (!stages) return 0;
  const idx = stages.findIndex(s => daysElapsed >= s.dayStart && daysElapsed <= s.dayEnd);
  return idx >= 0 ? idx : stages.length - 1;
}

function getDaysUntilNextStage(cropName, daysElapsed) {
  const stages = STAGE_THRESHOLDS[cropName];
  if (!stages) return null;
  const current = stages.find(s => daysElapsed >= s.dayStart && daysElapsed <= s.dayEnd);
  if (!current) return null;
  return current.dayEnd - daysElapsed;
}

/* ── Helpers ────────────────────────────────────────────────── */
function healthColor(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}

function confidenceLabel(score) {
  if (score >= 80) return { text: 'High Confidence', cls: 'high' };
  if (score >= 65) return { text: 'Moderate Confidence', cls: 'moderate' };
  return { text: 'Low Confidence', cls: 'low' };
}

function formatHarvestDate(daysRemaining) {
  const d = new Date();
  d.setDate(d.getDate() + daysRemaining);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function idealGrowth(day, totalDays) {
  const mid = totalDays / 2;
  const k = 0.35;
  return parseFloat((100 / (1 + Math.exp(-k * (day - mid)))).toFixed(1));
}

function actualGrowth(day, healthHistory, totalDays) {
  let growth = 0;
  for (let i = 0; i <= day; i++) {
    const healthFactor =
      (healthHistory[i] || healthHistory[healthHistory.length - 1]) / 100;
    const dailyIdeal =
      idealGrowth(i, totalDays) - idealGrowth(i - 1 >= 0 ? i - 1 : 0, totalDays);
    growth += dailyIdeal * healthFactor;
  }
  return parseFloat(Math.min(growth, 100).toFixed(1));
}

/* ── Circular progress ring (SVG) ───────────────────────────── */
const ProgressRing = ({ progress, healthScore }) => {
  const radius = 48;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const color = healthColor(healthScore);

  return (
    <div className="progress-ring-container">
      <svg width={radius * 2} height={radius * 2}>
        <circle className="ring-bg" cx={radius} cy={radius} r={normalizedRadius} />
        <circle
          className={`ring-progress ${color}`}
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
        />
      </svg>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────── */
const Harvest = () => {
  const [harvestData, setHarvestData] = useState(null);
  const [visibleIcons, setVisibleIcons] = useState({
    Lettuce: false, Spinach: false, Basil: false, Kangkung: false
  });
  const [activeCrop, setActiveCrop] = useState(0);
  const [showForecast, setShowForecast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* Fetch from API on mount, fallback to demo data */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/insights');
        if (res.ok) {
          const json = await res.json();
          if (json.harvest && json.harvest.length > 0) {
            setHarvestData(json.harvest);
          } else {
            setHarvestData(DEMO_HARVEST);
          }
        } else {
          setHarvestData(DEMO_HARVEST);
        }
      } catch {
        setHarvestData(DEMO_HARVEST);
      } finally {
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* Staggered icons animation */
  useEffect(() => {
    const crops = harvestData || [];
    if (!crops.length) return;
    const CROP_DELAYS = { Lettuce: 150, Spinach: 300, Basil: 450, Kangkung: 600 };
    crops.forEach(crop => {
      setTimeout(() => {
        setVisibleIcons(prev => ({ ...prev, [crop.crop]: true }));
      }, CROP_DELAYS[crop.crop] || 150);
    });
  }, [harvestData]);

  /* ── Derived calculations ──────────────────────────────────── */
  const crops = harvestData || [];

  // Section 2: yield forecast
  const yieldRows = crops.map((c) => {
    const expected = parseFloat((c.base_yield_kg * (c.health_score / 100)).toFixed(1));
    const best = c.base_yield_kg;
    const worst = parseFloat(
      Math.max(c.base_yield_kg * ((c.health_score - 15) / 100), 0.1).toFixed(1)
    );
    return { crop: c.crop, expected, best, worst };
  });
  const totals = {
    expected: parseFloat(yieldRows.reduce((s, r) => s + r.expected, 0).toFixed(1)),
    best: parseFloat(yieldRows.reduce((s, r) => s + r.best, 0).toFixed(1)),
    worst: parseFloat(yieldRows.reduce((s, r) => s + r.worst, 0).toFixed(1)),
  };



  // Section 3: chart data for active crop
  const buildChartData = () => {
    if (!crops.length) return [];
    const crop = crops[activeCrop];
    const totalDays = crop.days_elapsed + crop.days_remaining;
    const points = [];

    for (let d = 0; d <= totalDays; d++) {
      const point = { day: `Day ${d + 1}`, ideal: idealGrowth(d, totalDays) };

      if (d <= crop.days_elapsed) {
        point.actual = actualGrowth(d, crop.health_history, totalDays);
      }

      if (showForecast && d >= crop.days_elapsed) {
        if (d === crop.days_elapsed) {
          // Anchor forecast to last actual point
          point.forecast = actualGrowth(crop.days_elapsed, crop.health_history, totalDays);
        } else {
          // Extend using current health_score
          let growth = actualGrowth(crop.days_elapsed, crop.health_history, totalDays);
          for (let j = crop.days_elapsed + 1; j <= d; j++) {
            const healthFactor = crop.health_score / 100;
            const dailyIdeal = idealGrowth(j, totalDays) - idealGrowth(j - 1, totalDays);
            growth += dailyIdeal * healthFactor;
          }
          point.forecast = parseFloat(Math.min(growth, 100).toFixed(1));
        }
      }
      points.push(point);
    }
    return points;
  };

  const chartData = buildChartData();
  const todayIndex = crops.length ? crops[activeCrop].days_elapsed : 0;

  /* ── Render ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <main className="harvest-main">
        <div className="harvest-skeleton">
          <div className="skeleton-row">
            <div className="skeleton-box" />
            <div className="skeleton-box" />
            <div className="skeleton-box" />
          </div>
          <div className="skeleton-row two-col">
            <div className="skeleton-box" />
            <div className="skeleton-box" />
          </div>
          <div className="skeleton-row">
            <div className="skeleton-box wide" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="harvest-main">
      {/* ── Page Header ──────────────────────────────────────── */}
      <header className="harvest-header">
        <div className="harvest-header-left">
          <h1>Harvest Intelligence</h1>
          <p>AI-powered yield forecasting and growth tracking</p>
        </div>
        {lastUpdated && (
          <div className="harvest-last-updated">
            <Clock size={14} />
            <span>Last updated: {lastUpdated}</span>
          </div>
        )}
      </header>

      {/* ── SECTION 1 — Estimated Harvest Date ───────────────── */}
      <div className="harvest-section-title">Harvest Estimated Date</div>
      <div className="harvest-cards-row">
        {crops.map((c, idx) => {
          const color = healthColor(c.health_score);
          const conf = confidenceLabel(c.health_score);
          return (
            <div
              key={idx}
              className={`harvest-est-card health-${color === 'green' ? 'good' : color === 'amber' ? 'moderate' : 'poor'}`}
            >
              <div className="est-card-top">
                <span className="est-card-title">
                  {CROP_EMOJI[c.crop] || '🌱'} {c.crop}
                </span>
                <span className={`health-badge ${color}`}>
                  {c.health_score}/100
                </span>
              </div>
              <span className="est-card-zone">{c.zone}</span>
              <div className="est-card-stats">
                <span className="est-days">{c.days_remaining} <small>days left</small></span>
                <span className="est-date">📅 {formatHarvestDate(c.days_remaining)}</span>
              </div>
              <div className="est-progress-section">
                <div className="est-progress-track">
                  <div
                    className={`est-progress-fill ${color}`}
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
                <span className="est-progress-pct">{c.progress}%</span>
              </div>
              <span className={`est-conf ${conf.cls}`}>{conf.text}</span>
            </div>
          );
        })}
      </div>

      {/* ── SECTION 2 — Yield Forecast + Resource Cost ────────── */}
      <div className="harvest-section-title">Estimated Forecast Yield + Resource Cost</div>
      <div className="harvest-forecast-row">
        {/* Left: yield table */}
        <div className="harvest-card">
          <div className="harvest-card-title">Estimated Yield Forecast</div>
          <table className="yield-table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Expected (kg)</th>
                <th>Best Case (kg)</th>
                <th>Worst Case (kg)</th>
              </tr>
            </thead>
            <tbody>
              {yieldRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.crop}</td>
                  <td>{r.expected}</td>
                  <td className="best-case">{r.best}</td>
                  <td className="worst-case">{r.worst}</td>
                </tr>
              ))}
              <tr>
                <td>Total</td>
                <td>{totals.expected}</td>
                <td className="best-case">{totals.best}</td>
                <td className="worst-case">{totals.worst}</td>
              </tr>
            </tbody>
          </table>
          <div className="yield-note">
            Yield adjusted based on current health score and sensor conditions
          </div>
        </div>

        {/* Right: Growing Stage Table */}
        <div className="harvest-card">
          <div className="harvest-card-title">Growing Stage</div>
          <div className="harvest-card-subtitle">Current lifecycle position per crop</div>
          <div className="stage-table">
            {/* Header Row */}
            <div className="stage-header-cell empty" />
            {STAGE_NAMES.map((name, i) => (
              <div key={i} className="stage-header-cell">
                {name}
              </div>
            ))}

            {/* Crop Rows */}
            {crops.map((c, idx) => {
              const stageIdx = getCurrentStageIndex(c.crop, c.days_elapsed);
              const stages = STAGE_THRESHOLDS[c.crop] || STAGE_THRESHOLDS.Lettuce;
              const currentStage = stages[stageIdx];
              return (
                <React.Fragment key={idx}>
                  <div className="stage-crop-label-cell">
                    <div className="stage-crop-name-label">{CROP_EMOJI[c.crop]} {c.crop}</div>
                    <div className="stage-crop-zone-label">{c.zone}</div>
                  </div>
                  
                  <div className="stage-cells-wrapper">
                    {/* Background Grid Cells */}
                    {STAGE_NAMES.map((name, si) => (
                      <div key={si} className="stage-cell" />
                    ))}
                    
                    {/* Sliding Icon */}
                    <div 
                      className={`stage-sliding-icon ${visibleIcons[c.crop] ? 'active' : ''}`}
                      style={{ 
                        left: visibleIcons[c.crop] ? `${(stageIdx * 20) + 10}%` : '0%',
                        opacity: visibleIcons[c.crop] ? 1 : 0
                      }}
                    >
                      <span className="stage-emoji">{CROP_EMOJI[c.crop]}</span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 3 — Growth Curve ──────────────────────────── */}
      <div className="harvest-section-title">Growth Curve Analysis</div>
      <div className="growth-curve-card">
        <div className="growth-curve-header">
          <h3>Growth Curve Analysis</h3>
          <div className="growth-curve-controls">
            <div className="crop-tabs">
              {crops.map((c, i) => (
                <button
                  key={i}
                  className={`crop-tab ${activeCrop === i ? 'active' : ''}`}
                  onClick={() => setActiveCrop(i)}
                >
                  {c.crop}
                </button>
              ))}
            </div>
            <button
              className={`harvest-toggle-forecast-btn ${showForecast ? 'active' : ''}`}
              onClick={() => setShowForecast(!showForecast)}
            >
              <TrendingUp size={14} />
              {showForecast ? 'Hide Forecast' : 'Show Forecast'}
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="day"
              stroke="#888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              stroke="#888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              unit="%"
              label={{ value: 'Growth %', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9ca3af' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            <ReferenceLine
              x={`Day ${todayIndex + 1}`}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              label={{ value: 'Today', position: 'top', fill: '#9ca3af', fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="ideal"
              name="Ideal Growth"
              stroke="#9ca3af"
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Growth"
              stroke="#2d6a4f"
              strokeWidth={2}
              dot={false}
            />
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke="#4ade80"
                strokeDasharray="6 3"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
};

export default Harvest;
