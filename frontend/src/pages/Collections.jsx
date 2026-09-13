import { useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { usePolling } from '../hooks/usePolling.js'
import api from '../api/client.js'

export default function Collections() {
  const collections = usePolling(() => api.getCollections(), 15000)
  const bins = usePolling(() => api.getBins(), 15000)
  const [form, setForm] = useState({ bin_id: '', worker_id: '', vehicle_id: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const pendingBins = (bins.data || []).filter(b => b.status === 'full' || b.status === 'critical')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.bin_id) return
    setSubmitting(true)
    setMessage(null)
    try {
      await api.recordCollection(form)
      setMessage({ type: 'success', text: `Collection recorded for ${form.bin_id}.` })
      setForm({ bin_id: '', worker_id: '', vehicle_id: '' })
      collections.refresh()
      bins.refresh()
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not record collection. Check the bin ID.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopBar liveCount={null} />
      <div className="page-content">
        <h1 className="page-title">Collection Management</h1>
        <p className="page-subtitle">Mark bins as collected and review collection history.</p>

        <div className="grid grid-2" style={{ alignItems: 'start', marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-title">Record a Collection</div>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Bin</label>
                <select value={form.bin_id} onChange={e => setForm({ ...form, bin_id: e.target.value })} required>
                  <option value="">Select a bin...</option>
                  {(bins.data || []).map(b => (
                    <option key={b.bin_id} value={b.bin_id}>
                      {b.bin_id} — {b.status} ({b.current_fill_percentage}%)
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Worker ID (optional)</label>
                <input value={form.worker_id} onChange={e => setForm({ ...form, worker_id: e.target.value })} placeholder="e.g. W-102" />
              </div>
              <div className="field">
                <label>Vehicle ID (optional)</label>
                <input value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} placeholder="e.g. TN-09-AB-1234" />
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Recording...' : 'Mark as Collected'}
              </button>
              {message && (
                <div style={{ marginTop: 12, fontSize: 13, color: message.type === 'success' ? 'var(--status-empty)' : 'var(--status-critical)' }}>
                  {message.text}
                </div>
              )}
            </form>
          </div>

          <div className="panel">
            <div className="panel-title">Bins Awaiting Collection ({pendingBins.length})</div>
            {pendingBins.length === 0 ? (
              <div className="empty-state">Nothing needs collection right now.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingBins.map(b => (
                  <div key={b.bin_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <span className="mono">{b.bin_id}</span>
                    <StatusPill status={b.status} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.current_fill_percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Collection History</div>
          {!collections.data || collections.data.length === 0 ? (
            <div className="empty-state">No collections recorded yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bin ID</th>
                  <th>Collected At</th>
                  <th>Previous Fill</th>
                  <th>Weight Collected</th>
                  <th>Worker</th>
                  <th>Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {collections.data.map(c => (
                  <tr key={c.id}>
                    <td className="mono">{c.bin_id}</td>
                    <td>{new Date(c.collection_time).toLocaleString()}</td>
                    <td>{c.previous_fill_level}%</td>
                    <td>{c.collected_weight ?? '—'} kg</td>
                    <td>{c.worker_id || '—'}</td>
                    <td>{c.vehicle_id || '—'}</td>
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
