// Chart wrapper components using Chart.js
const { useEffect, useRef } = React;

function useChart(config, deps) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, config);
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, deps || []);
  return ref;
}

// Common Chart.js global defaults
if (window.Chart) {
  Chart.defaults.font.family = "'Pretendard', system-ui, sans-serif";
  Chart.defaults.font.size = 11.5;
  Chart.defaults.color = '#475569';
  Chart.defaults.borderColor = '#E2E8F0';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 14;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15,23,42,0.95)';
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 6;
  Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 12 };
  Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
  Chart.defaults.plugins.tooltip.boxPadding = 4;
}

const fmt = window.CRMData.fmtKRW;
const fmtFull = window.CRMData.fmtKRWFull;

// 3-column bar chart: 전월 / 당월예정 / 익월예정
function CollectionBarChart({ unitId, onBarClick }) {
  const data = useRef(null);
  const records = window.CRMData.ALL_RECORDS;
  const get = (off) => window.CRMData.getRecords({ unitId, monthOffset: off });
  const prev = window.CRMData.sumAmount(get(-1).filter(r => r.status === '완료'));
  const curr = window.CRMData.sumAmount(get(0));
  const next = window.CRMData.sumAmount(get(1));

  const ref = useChart({
    type: 'bar',
    data: {
      labels: ['전월 수금', '당월 예정', '익월 예정'],
      datasets: [{
        data: [prev, curr, next],
        backgroundColor: ['#94A3B8', '#2563EB', '#60A5FA'],
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 50,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (evt, elements) => {
        if (elements.length && onBarClick) {
          const off = [-1, 0, 1][elements[0].index];
          onBarClick(off);
        }
      },
      onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => '  ' + fmtFull(ctx.parsed.y),
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => fmt(v) },
          grid: { color: '#F1F5F9' },
        },
        x: { grid: { display: false } }
      }
    }
  }, [unitId]);
  return <canvas ref={ref} />;
}

// Weekly line chart (1주차 ~ 5주차)
function WeeklyTrendChart({ unitId }) {
  const trend = window.CRMData.getWeeklyTrend(unitId);
  const ref = useChart({
    type: 'line',
    data: {
      labels: ['1주차', '2주차', '3주차', '4주차', '5주차'],
      datasets: [
        {
          label: '예정 수금',
          data: trend.expected,
          borderColor: '#94A3B8',
          backgroundColor: 'rgba(148,163,184,0.08)',
          borderDash: [4, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#94A3B8',
          borderWidth: 2,
        },
        {
          label: '실제 수금',
          data: trend.collected,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.10)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#2563EB',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          borderWidth: 2.5,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top', align: 'end' },
        tooltip: { callbacks: { label: ctx => '  ' + ctx.dataset.label + ': ' + fmtFull(ctx.parsed.y) } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => fmt(v) }, grid: { color: '#F1F5F9' } },
        x: { grid: { display: false } }
      }
    }
  }, [unitId]);
  return <canvas ref={ref} />;
}

// Service breakdown stacked bar (last 4 months by service category)
function ServiceStackedChart({ unitId }) {
  const items = window.CRMData.itemsByUnit[unitId];
  const palette = ['#2563EB', '#60A5FA', '#0EA5E9', '#7C3AED', '#DB2777', '#F59E0B'];
  const months = [-2, -1, 0, 1];
  const monthLabels = ['3월', '4월', '5월(당월)', '6월'];
  const datasets = items.map((item, i) => ({
    label: item,
    data: months.map(off => {
      const recs = window.CRMData.getRecords({ unitId, monthOffset: off }).filter(r => r.item === item);
      return window.CRMData.sumAmount(recs);
    }),
    backgroundColor: palette[i % palette.length],
    borderRadius: 2,
    borderSkipped: false,
  }));
  const ref = useChart({
    type: 'bar',
    data: { labels: monthLabels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', align: 'start', labels: { boxWidth: 10, boxHeight: 10 } },
        tooltip: { callbacks: { label: ctx => '  ' + ctx.dataset.label + ': ' + fmtFull(ctx.parsed.y) } }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, ticks: { callback: v => fmt(v) }, grid: { color: '#F1F5F9' } }
      }
    }
  }, [unitId]);
  return <canvas ref={ref} />;
}

// Customer-type donut
function CustomerTypeDonut({ unitId }) {
  const d = window.CRMData.getCustomerTypeBreakdown(unitId);
  const ref = useChart({
    type: 'doughnut',
    data: {
      labels: ['신규', '재구매'],
      datasets: [{ data: [d.신규, d.재구매], backgroundColor: ['#2563EB', '#CBD5E1'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: ctx => '  ' + ctx.label + ': ' + fmtFull(ctx.parsed) } }
      }
    }
  }, [unitId]);
  return <canvas ref={ref} />;
}

// All-units comparison bar
function UnitsComparisonChart() {
  const units = window.CRMData.businessUnits;
  const data = units.map(u => window.CRMData.sumAmount(window.CRMData.getRecords({ unitId: u.id, monthOffset: 0 })));
  const ref = useChart({
    type: 'bar',
    data: {
      labels: units.map(u => u.name),
      datasets: [{
        data,
        backgroundColor: units.map(u => u.color),
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 32,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => '  ' + fmtFull(ctx.parsed.x) } }
      },
      scales: {
        x: { ticks: { callback: v => fmt(v) }, grid: { color: '#F1F5F9' } },
        y: { grid: { display: false } }
      }
    }
  }, []);
  return <canvas ref={ref} />;
}

// Achievement gauge (semi-circle)
function GaugeRing({ percent, size = 160 }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, percent / 100);
  const color = percent >= 80 ? '#16A34A' : percent >= 50 ? '#2563EB' : '#DC2626';
  return (
    <div className="gauge-wrap" style={{ width: size, height: size }}>
      <svg className="gauge-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="12"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${c-dash}`}
          strokeDashoffset={c/4}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="gauge-center">
        <div className="gauge-percent" style={{ color }}>{Math.round(percent)}%</div>
        <div className="gauge-label">달성률</div>
      </div>
    </div>
  );
}

window.Charts = { CollectionBarChart, WeeklyTrendChart, ServiceStackedChart, CustomerTypeDonut, UnitsComparisonChart, GaugeRing };
