const COLOR_BY_STATUS = {
  empty: 'var(--status-empty)',
  medium: 'var(--status-medium)',
  full: 'var(--status-full)',
  critical: 'var(--status-critical)',
}

export default function FillBar({ percentage = 0, status = 'empty', showLabel = true }) {
  const pct = Math.max(0, Math.min(100, percentage))
  return (
    <div>
      <div className="fill-track">
        <div
          className="fill-bar"
          style={{ width: `${pct}%`, background: COLOR_BY_STATUS[status] || 'var(--text-faint)' }}
        />
      </div>
      {showLabel && (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }} className="mono">
          {pct.toFixed(0)}%
        </div>
      )}
    </div>
  )
}
