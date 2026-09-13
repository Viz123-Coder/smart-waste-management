import { useState } from 'react'
import TopBar from '../components/TopBar.jsx'

export default function Settings() {
  const [apiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api')

  return (
    <>
      <TopBar liveCount={null} />
      <div className="page-content">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration and reference information.</p>

        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          <div className="panel">
            <div className="panel-title">Backend Connection</div>
            <div className="field">
              <label>API Base URL</label>
              <input value={apiUrl} readOnly />
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-faint)', margin: 0 }}>
              Set with <span className="mono">VITE_API_BASE_URL</span> in <span className="mono">frontend/.env</span>.
              Restart the dev server after changing it.
            </p>
          </div>

          <div className="panel">
            <div className="panel-title">Status Thresholds</div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>
              Defined in <span className="mono">backend/config/config.py</span> - edit and restart Flask to change.
            </p>
            <ThresholdRow label="Empty" range="0% – 30%" color="var(--status-empty)" />
            <ThresholdRow label="Medium" range="30% – 60%" color="var(--status-medium)" />
            <ThresholdRow label="Full" range="60% – 85%" color="var(--status-full)" />
            <ThresholdRow label="Critical" range="85% – 100%" color="var(--status-critical)" />
          </div>

          <div className="panel">
            <div className="panel-title">System Architecture</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 2 }}>
              ESP32 + Sensors<br />
              &nbsp;&nbsp;&darr; Wi-Fi<br />
              Flask REST API<br />
              &nbsp;&nbsp;&darr;<br />
              Supabase PostgreSQL<br />
              &nbsp;&nbsp;&darr;<br />
              ML Prediction Engine<br />
              &nbsp;&nbsp;&darr;<br />
              React Dashboard (this app)
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Sending Test Data</div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
              Before your ESP32 hardware is ready, simulate readings from the backend:
            </p>
            <pre style={{ background: 'var(--panel-raised)', padding: 12, borderRadius: 6, fontSize: 12, overflowX: 'auto' }}>
{`python backend/scripts/send_test_data.py --simulate 15`}
            </pre>
          </div>
        </div>
      </div>
    </>
  )
}

function ThresholdRow({ label, range, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
        {label}
      </span>
      <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>{range}</span>
    </div>
  )
}
