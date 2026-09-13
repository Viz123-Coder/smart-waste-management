import { useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import StatusPill from '../components/StatusPill.jsx'
import api from '../api/client.js'

export default function RouteOptimization() {
  const [route, setRoute] = useState(null)
  const [minStatus, setMinStatus] = useState('full')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function calculate() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getOptimizedRoute(minStatus)
      setRoute(result)
    } catch (e) {
      setError('Could not reach the backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TopBar liveCount={null} />
      <div className="page-content">
        <h1 className="page-title">Route Optimization</h1>
        <p className="page-subtitle">
          Builds a collection order using a nearest-neighbor algorithm, prioritizing critical bins.
        </p>

        <div className="panel" style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ maxWidth: 220 }}>
            <label>Minimum status to include</label>
            <select value={minStatus} onChange={e => setMinStatus(e.target.value)}>
              <option value="medium">Medium and above</option>
              <option value="full">Full and above</option>
              <option value="critical">Critical only</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={calculate} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Route'}
          </button>
        </div>

        {error && <div className="panel" style={{ marginBottom: 20 }}>{error}</div>}

        {route && (
          <>
            {route.stops?.length === 0 ? (
              <div className="panel empty-state">{route.message || 'No bins currently need collection.'}</div>
            ) : (
              <>
                <div className="grid grid-3" style={{ marginBottom: 20 }}>
                  <SummaryCard label="Stops" value={route.stops.length} />
                  <SummaryCard label="Total Distance" value={`${route.total_distance_km} km`} />
                  <SummaryCard label="Return Leg" value={`${route.return_to_facility_km} km`} />
                </div>

                <div className="panel">
                  <div className="panel-title">Recommended Route</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    <RouteChip label="Facility" />
                    {route.stops.map((s, i) => (
                      <span key={s.bin_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Arrow />
                        <RouteChip label={s.bin_id} status={s.status} />
                      </span>
                    ))}
                    <Arrow />
                    <RouteChip label="Facility" />
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Bin ID</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Distance from Previous</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {route.stops.map((s, i) => (
                        <tr key={s.bin_id}>
                          <td>{i + 1}</td>
                          <td className="mono">{s.bin_id}</td>
                          <td>{s.location}</td>
                          <td><StatusPill status={s.status} /></td>
                          <td>{s.distance_from_previous_km} km</td>
                          <td><Link to={`/bins/${s.bin_id}`} className="btn btn-sm">View</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="panel">
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  )
}

function RouteChip({ label, status }) {
  return (
    <span style={{
      padding: '6px 12px', borderRadius: 6, background: 'var(--panel-raised)',
      border: '1px solid var(--border)', fontWeight: 500,
    }}>
      {label}
    </span>
  )
}

function Arrow() {
  return <span style={{ color: 'var(--text-faint)' }}>&rarr;</span>
}
