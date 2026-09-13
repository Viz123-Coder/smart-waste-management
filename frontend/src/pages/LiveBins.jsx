import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import StatusPill from '../components/StatusPill.jsx'
import FillBar from '../components/FillBar.jsx'
import { usePolling } from '../hooks/usePolling.js'
import api from '../api/client.js'

const FILTERS = ['all', 'empty', 'medium', 'full', 'critical']

export default function LiveBins() {
  const bins = usePolling(() => api.getBins(), 10000)
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    const list = bins.data || []
    if (filter === 'all') return list
    return list.filter(b => b.status === filter)
  }, [bins.data, filter])

  return (
    <>
      <TopBar liveCount={bins.data?.length} lastRefresh={bins.lastUpdated?.toLocaleTimeString()} />
      <div className="page-content">
        <h1 className="page-title">Live Bin Monitoring</h1>
        <p className="page-subtitle">Every bin's current reading, updated every 10 seconds.</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              className="btn btn-sm"
              onClick={() => setFilter(f)}
              style={{
                textTransform: 'capitalize',
                borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {bins.loading ? (
          <div className="empty-state">Loading bins...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state panel">No bins match this filter.</div>
        ) : (
          <div className="grid grid-3">
            {filtered.map(b => (
              <Link key={b.bin_id} to={`/bins/${b.bin_id}`} className="panel" style={{ display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="mono" style={{ fontWeight: 600 }}>{b.bin_id}</span>
                  <StatusPill status={b.status} />
                </div>
                <FillBar percentage={b.current_fill_percentage} status={b.status} />
                <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {b.location || 'Unassigned zone'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--text-faint)' }}>
                  <span>Weight: {b.current_weight ?? '—'} kg</span>
                  <span>{b.last_updated ? timeAgo(b.last_updated) : 'no data'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
