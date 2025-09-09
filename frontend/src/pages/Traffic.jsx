import React, { useEffect, useState } from 'react';
import { trafficAPI } from '../services/api';
import { RiBarChart2Line, RiPagesLine, RiShareForwardLine, RiDeviceLine, RiComputerLine, RiSmartphoneLine, RiTabletLine, RiApps2Line } from 'react-icons/ri';
import '../styles/pages/static-pages.css';

const DATE_OPTIONS = [
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 15 days', value: 15 },
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 1 day', value: 1 },
];

const deviceIcon = (device) => {
  switch (device?.toLowerCase()) {
    case 'desktop': return <RiComputerLine style={{ color: 'var(--color-primary)', fontSize: 20 }} />;
    case 'mobile': return <RiSmartphoneLine style={{ color: 'var(--color-primary)', fontSize: 20 }} />;
    case 'tablet': return <RiTabletLine style={{ color: 'var(--color-primary)', fontSize: 20 }} />;
    default: return <RiDeviceLine style={{ color: 'var(--color-primary)', fontSize: 20 }} />;
  }
};

function TrafficSkeleton() {
  return (
    <>
      <div style={{ marginBottom: 32, background: 'var(--bg-secondary)', borderRadius: 8, padding: '1.2rem 1rem', boxShadow: 'var(--shadow-xs)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 32, height: 32, background: 'var(--border-primary)', borderRadius: 8, marginRight: 16, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 180, height: 18, background: 'var(--border-primary)', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ width: 100, height: 28, background: 'var(--border-primary)', borderRadius: 4 }} />
        </div>
      </div>
      <div className="traffic-flex" style={{ gap: 32, marginBottom: 32 }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ width: 120, height: 18, background: 'var(--border-primary)', borderRadius: 4, marginBottom: 10 }} />
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {[...Array(4)].map((_, i) => (
              <li key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ width: 24, height: 18, background: 'var(--border-primary)', borderRadius: 4 }} />
                <div style={{ width: 120, height: 16, background: 'var(--border-primary)', borderRadius: 4 }} />
                <div style={{ marginLeft: 'auto', width: 60, height: 16, background: 'var(--border-primary)', borderRadius: 4 }} />
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ width: 160, height: 18, background: 'var(--border-primary)', borderRadius: 4, marginBottom: 10 }} />
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {[...Array(4)].map((_, i) => (
              <li key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ width: 24, height: 18, background: 'var(--border-primary)', borderRadius: 4 }} />
                <div style={{ width: 120, height: 16, background: 'var(--border-primary)', borderRadius: 4 }} />
                <div style={{ marginLeft: 'auto', width: 60, height: 16, background: 'var(--border-primary)', borderRadius: 4 }} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="traffic-flex" style={{ gap: 32, marginBottom: 32 }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ width: 180, height: 18, background: 'var(--border-primary)', borderRadius: 4, marginBottom: 10 }} />
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {[...Array(3)].map((_, i) => (
              <li key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ width: 24, height: 18, background: 'var(--border-primary)', borderRadius: 4 }} />
                <div style={{ width: 120, height: 16, background: 'var(--border-primary)', borderRadius: 4 }} />
                <div style={{ marginLeft: 'auto', width: 60, height: 16, background: 'var(--border-primary)', borderRadius: 4 }} />
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ width: 180, height: 18, background: 'var(--border-primary)', borderRadius: 4, marginBottom: 10 }} />
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {[...Array(3)].map((_, i) => (
              <li key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ width: 24, height: 18, background: 'var(--border-primary)', borderRadius: 4 }} />
                <div style={{ width: 120, height: 16, background: 'var(--border-primary)', borderRadius: 4 }} />
                <div style={{ marginLeft: 'auto', width: 60, height: 16, background: 'var(--border-primary)', borderRadius: 4 }} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

const Traffic = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setData(null); // Clear data immediately on change
    setLoading(true);
    setError(null);
    trafficAPI.getOverview(days)
      .then(json => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to fetch analytics');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch analytics');
        setLoading(false);
      });
  }, [days]);

  return (
    <div className="static-content" style={{ maxWidth: 1100, margin: '2.5rem auto', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '3.5rem 2.5rem', minHeight: 400 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.5rem', marginBottom: 24 }}>
        <RiBarChart2Line style={{ color: 'var(--color-primary)', fontSize: 28 }} />
        Traffic Analytics
      </h2>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label htmlFor="date-range" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Date Range:</label>
        <select
          id="date-range"
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          style={{ padding: '0.4rem 1rem', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 500 }}
        >
          {DATE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {loading && <TrafficSkeleton />}
      {error && <p style={{ color: 'var(--color-error)', fontWeight: 500 }}>{error}</p>}
      {data && !loading && !error && (
        <>
          <div style={{ marginBottom: 32, background: 'var(--bg-secondary)', borderRadius: 8, padding: '1.2rem 1rem', boxShadow: 'var(--shadow-xs)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <RiBarChart2Line style={{ color: 'var(--color-primary)', fontSize: 32 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 18 }}>Total Page Views ({DATE_OPTIONS.find(opt => opt.value === days)?.label})</div>
              <div style={{ fontSize: 32, color: 'var(--color-primary)', fontWeight: 700 }}>{data.totalPageViews}</div>
            </div>
          </div>
          <div className="traffic-flex" style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 17, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiPagesLine style={{ color: 'var(--color-primary)', fontSize: 22 }} /> Top Pages
              </div>
              <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {data.topPages.map((page, i) => (
                  <li key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{i + 1}.</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{page.pagePath}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 600 }}>{page.pageViews} views</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 17, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiShareForwardLine style={{ color: 'var(--color-primary)', fontSize: 22 }} /> Top Traffic Sources
              </div>
              <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {data.trafficSources.map((src, i) => (
                  <li key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{i + 1}.</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{src.sourceMedium}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 600 }}>{src.sessions} sessions</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Device & Platform Breakdown */}
          <div className="traffic-flex" style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 17, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiDeviceLine style={{ color: 'var(--color-primary)', fontSize: 22 }} /> Device Breakdown
              </div>
              <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {data.deviceBreakdown.map((dev, i) => (
                  <li key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                    {deviceIcon(dev.device)}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>{dev.device}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 600 }}>{dev.sessions} sessions</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 17, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiApps2Line style={{ color: 'var(--color-primary)', fontSize: 22 }} /> Platform Breakdown
              </div>
              <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {data.platformBreakdown.map((plat, i) => (
                  <li key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{i + 1}.</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{plat.platform}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 600 }}>{plat.sessions} sessions</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Traffic; 