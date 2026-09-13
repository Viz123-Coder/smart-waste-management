import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import TopBar from '../components/TopBar.jsx'
import StatusPill from '../components/StatusPill.jsx'
import FillBar from '../components/FillBar.jsx'
import { usePolling } from '../hooks/usePolling.js'
import api from '../api/client.js'

export default function BinDetails() {
  const { binId } = useParams()
  const bin = usePolling(() => api.getBin(binId), 10000, [binId])
  const readings = usePolling(() => api.getReadings(binId, 40), 10000, [binId])
  const prediction = usePolling(() => api.getPrediction(binId), 20000, [binId])

  const chartData = (readings.data || []).map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fill: r.fill_percentage,
  }))

  return (
    <>
      <TopBar liveCount={null} />
      <div className="page-content">
        <Link to="/live-bins" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>&larr; Back to Live Bins</Link>

        {bin.error ? (
          <div className="panel" style={{ marginTop: 16 }}>Bin not found, or backend not reachable.</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 4px' }}>
              <h1 className="page-title mono" style={{ margin: 0 }}>{binId}</h1>
              {bin.data && <StatusPill status={bin.data.status} />}
            </div>
            <p className="page-subtitle">{bin.data?.location || 'Loading location...'}</p>

            <div className="grid grid-3" style={{ marginBottom: 20 }}>
              <div className="panel">
                <div className="panel-title">Current Fill Level</div>
                <FillBar percentage={bin.data?.current_fill_percentage || 0} status={bin.data?.status} />
                <div style={{ fontSize: 26, fontFamily: 'var(--font-mono)', marginTop: 10 }}>
                  {bin.data?.current_fill_percentage?.toFixed?.(0) ?? '—'}%
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">Weight / Temperature</div>
                <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)' }}>{bin.data?.current_weight ?? '—'} kg</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>
                  Last updated {bin.data?.last_updated ? new Date(bin.data.last_updated).toLocaleString() : '—'}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">AI Prediction</div>
                {prediction.data?.predicted_status === 'will_reach_full' ? (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
                      {prediction.data.message}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>
                      Fill rate: {prediction.data.fill_rate_per_hour}%/hr
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {prediction.data?.message || 'Calculating...'}
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Fill Level History</div>
              {chartData.length < 2 ? (
                <div className="empty-state">Not enough readings yet to plot a trend.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                    <XAxis dataKey="time" stroke="var(--text-faint)" fontSize={11} />
                    <YAxis stroke="var(--text-faint)" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: 'var(--panel-raised)', border: '1px solid var(--border)', fontSize: 12 }} />
                    <Line type="monotone" dataKey="fill" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
