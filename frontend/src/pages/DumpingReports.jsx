import { useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import { usePolling } from '../hooks/usePolling.js'
import api from '../api/client.js'

const STATUS_OPTIONS = ['Open', 'Investigating', 'Resolved']

export default function DumpingReports() {
  const reports = usePolling(() => api.getDumpingReports(), 15000)
  const [form, setForm] = useState({ location: '', description: '', image: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.location) return
    setSubmitting(true)
    try {
      await api.createDumpingReport(form)
      setForm({ location: '', description: '', image: '' })
      reports.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(id, status) {
    await api.updateDumpingReport(id, status)
    reports.refresh()
  }

  return (
    <>
      <TopBar liveCount={null} />
      <div className="page-content">
        <h1 className="page-title">Illegal Dumping Reports</h1>
        <p className="page-subtitle">Log and track reports of waste dumped outside of designated bins.</p>

        <div className="grid grid-2" style={{ alignItems: 'start', marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-title">New Report</div>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Location</label>
                <input
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Behind Zone C bus stand"
                  required
                />
              </div>
              <div className="field">
                <label>Description (optional)</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What was dumped, approximate quantity, etc."
                />
              </div>
              <div className="field">
                <label>Image URL (optional)</label>
                <input
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  placeholder="Link to an uploaded photo"
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>

          <div className="panel">
            <div className="panel-title">About This Module</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              Version 1 is a straightforward reporting workflow: anyone can log a dumping incident with a
              location and optional photo, and an administrator moves it through Open → Investigating →
              Resolved. A natural next step is plugging in an image-classification model to auto-flag
              suspected dumping photos before a human reviews them.
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Reports</div>
          {!reports.data || reports.data.length === 0 ? (
            <div className="empty-state">No reports yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Reported</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.data.map(r => (
                  <tr key={r.id}>
                    <td>{r.location}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.description || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} style={{ width: 150 }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
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
