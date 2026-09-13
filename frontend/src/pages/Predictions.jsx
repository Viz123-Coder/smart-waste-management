import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { usePolling } from '../hooks/usePolling.js'
import api from '../api/client.js'

const STATUS_LABEL = {
  will_reach_full: 'Approaching Full',
  stable: 'Stable',
  slow_fill: 'Slow Fill',
  insufficient_data: 'Learning...',
}

export default function Predictions() {
  const predictions = usePolling(() => api.getPredictions(), 20000)

  return (
    <>
      <TopBar liveCount={predictions.data?.length} lastRefresh={predictions.lastUpdated?.toLocaleTimeString()} />
      <div className="page-content">
        <h1 className="page-title">AI Fill Predictions</h1>
        <p className="page-subtitle">
          Each prediction is a simple linear trend line fitted to a bin's recent readings, projected forward to
          estimate when it will reach 100% full.
        </p>

        {!predictions.data || predictions.data.length === 0 ? (
          <div className="panel empty-state">No predictions yet - bins need at least 3 readings before a trend can be estimated.</div>
        ) : (
          <div className="grid grid-3">
            {predictions.data.map(p => (
              <div key={p.bin_id} className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="mono" style={{ fontWeight: 600 }}>{p.bin_id}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                    {STATUS_LABEL[p.predicted_status] || p.predicted_status}
                  </span>
                </div>
                <div style={{ fontSize: 14, marginBottom: 10 }}>
                  {p.predicted_status === 'will_reach_full' && p.predicted_time
                    ? `Expected full around ${new Date(p.predicted_time).toLocaleString()}`
                    : p.predicted_status === 'stable'
                      ? 'Fill level is steady - no collection needed soon.'
                      : p.predicted_status === 'insufficient_data'
                        ? 'Gathering more sensor history to build a trend.'
                        : 'Filling slowly - low priority.'}
                </div>
                <Link to={`/bins/${p.bin_id}`} className="btn btn-sm">View Bin</Link>
              </div>
            ))}
          </div>
        )}

        <div className="panel" style={{ marginTop: 24 }}>
          <div className="panel-title">How this works</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
            The backend fits a linear regression line through each bin's last ~20 readings (time vs. fill
            percentage). The slope of that line is the bin's fill rate. Extending the line forward to where it
            crosses 100% gives an estimated "time to full" - the same idea as extending a graph on paper with a
            ruler. This intentionally simple, explainable model is a good baseline; it can later be extended to
            factor in day-of-week patterns or per-zone waste generation trends.
          </p>
        </div>
      </div>
    </>
  )
}
