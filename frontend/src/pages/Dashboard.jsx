import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts'
import TopBar from '../components/TopBar.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusPill from '../components/StatusPill.jsx'
import FillBar from '../components/FillBar.jsx'
import { usePolling } from '../hooks/usePolling.js'
import api from '../api/client.js'

export default function Dashboard() {
  const bins = usePolling(() => api.getBins(), 15000)
  const alerts = usePolling(() => api.getAlerts('Open'), 15000)

  const stats = useMemo(() => {
    const list = bins.data || []
    const count = (s) => list.filter(b => b.status === s).length
    return {
      total: list.length,
      empty: count('empty'),
      medium: count('medium'),
      full: count('full'),
      critical: count('critical'),
      needsCollection: list.filter(b => b.status === 'full' || b.status === 'critical').length,
    }
  }, [bins.data])

  const statusBreakdown = [
    { name: 'Empty', value: stats.empty, color: 'var(--status-empty)' },
    { name: 'Medium', value: stats.medium, color: 'var(--status-medium)' },
    { name: 'Full', value: stats.full, color: 'var(--status-full)' },
    { name: 'Critical', value: stats.critical, color: 'var(--status-critical)' },
  ]

  return (
    <>
      <TopBar liveCount={bins.data?.length} lastRefresh={bins.lastUpdated?.toLocaleTimeString()} />
      <div className="page-content">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">City-wide bin network overview, refreshed automatically.</p>

        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <StatCard label="Total Bins" value={stats.total} accentColor="var(--info)" />
          <StatCard label="Empty Bins" value={stats.empty} accentColor="var(--status-empty)" />
          <StatCard label="Medium Bins" value={stats.medium} accentColor="var(--status-medium)" />
          <StatCard label="Full Bins" value={stats.full} accentColor="var(--status-full)" />
        </div>
        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          <StatCard
            label="Bins Requiring Collection"
            value={stats.needsCollection}
            accentColor="var(--status-critical)"
            sublabel="Full or critical status"
          />
          <StatCard
            label="Active Alerts"
            value={alerts.data?.length ?? '—'}
            accentColor="var(--accent)"
            sublabel={alerts.data?.length ? 'Needs attention' : 'All clear'}
          />
        </div>

        <div className="grid grid-2" style={{ marginBottom: 24, alignItems: 'stretch' }}>
          <div className="panel">
            <div className="panel-title">Bin Status Distribution</div>
            {stats.total === 0 ? (
              <EmptyChartState />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-faint)" fontSize={12} />
                  <YAxis stroke="var(--text-faint)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="panel">
            <div className="panel-title">Recent Alerts</div>
            {!alerts.data || alerts.data.length === 0 ? (
              <div className="empty-state">No active alerts right now.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alerts.data.slice(0, 5).map(a => (
                  <div key={a.id} style={rowStyle}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{a.alert_type}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.message}</div>
                    </div>
                    <Link to={`/bins/${a.bin_id}`} className="btn btn-sm">View</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Live Bin Status</div>
          {bins.loading ? (
            <div className="empty-state">Loading bins...</div>
          ) : stats.total === 0 ? (
            <NoBinsYet />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bin ID</th>
                  <th>Location</th>
                  <th>Fill Level</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bins.data.map(b => (
                  <tr key={b.bin_id}>
                    <td className="mono">{b.bin_id}</td>
                    <td>{b.location}</td>
                    <td style={{ width: 160 }}>
                      <FillBar percentage={b.current_fill_percentage} status={b.status} />
                    </td>
                    <td><StatusPill status={b.status} /></td>
                    <td style={{ color: 'var(--text-faint)', fontSize: 12 }}>
                      {b.last_updated ? new Date(b.last_updated).toLocaleString() : '—'}
                    </td>
                    <td><Link to={`/bins/${b.bin_id}`} className="btn btn-sm">Details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

function NoBinsYet() {
  return (
    <div className="empty-state">
      No bins yet. Send a test reading from the backend to see data appear here:
      <pre style={{
        marginTop: 12, textAlign: 'left', background: 'var(--panel-raised)',
        padding: 12, borderRadius: 6, fontSize: 12, overflowX: 'auto',
      }}>
{`python backend/scripts/send_test_data.py --simulate 10`}
      </pre>
    </div>
  )
}

function EmptyChartState() {
  return <div className="empty-state">No bin data yet.</div>
}

const tooltipStyle = {
  background: 'var(--panel-raised)', border: '1px solid var(--border)',
  borderRadius: 6, fontSize: 12, color: 'var(--text)',
}

const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '8px 0', borderBottom: '1px solid var(--border-soft)',
}
