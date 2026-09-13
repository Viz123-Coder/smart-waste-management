import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { usePolling } from '../hooks/usePolling.js'
import api from '../api/client.js'

export default function Alerts() {
  const alerts = usePolling(() => api.getAlerts(), 10000)

  async function resolve(id) {
    await api.resolveAlert(id)
    alerts.refresh()
  }

  const open = (alerts.data || []).filter(a => a.status === 'Open')
  const resolved = (alerts.data || []).filter(a => a.status === 'Resolved')

  return (
    <>
      <TopBar liveCount={open.length} lastRefresh={alerts.lastUpdated?.toLocaleTimeString()} />
      <div className="page-content">
        <h1 className="page-title">Alerts</h1>
        <p className="page-subtitle">Automatically raised when a bin crosses the collection threshold.</p>

        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-title">Open ({open.length})</div>
          {open.length === 0 ? (
            <div className="empty-state">No open alerts.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {open.map(a => (
                <div key={a.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {a.alert_type} — <Link to={`/bins/${a.bin_id}`} className="mono">{a.bin_id}</Link>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{a.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button className="btn btn-sm" onClick={() => resolve(a.id)}>Resolve</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Resolved ({resolved.length})</div>
          {resolved.length === 0 ? (
            <div className="empty-state">No resolved alerts yet.</div>
          ) : (
            <table>
              <thead>
                <tr><th>Bin</th><th>Type</th><th>Message</th><th>Date</th></tr>
              </thead>
              <tbody>
                {resolved.map(a => (
                  <tr key={a.id}>
                    <td className="mono">{a.bin_id}</td>
                    <td>{a.alert_type}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{a.message}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{new Date(a.created_at).toLocaleString()}</td>
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

const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 0', borderBottom: '1px solid var(--border-soft)',
}
