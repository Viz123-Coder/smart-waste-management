export default function TopBar({ liveCount, lastRefresh }) {
  return (
    <header style={styles.bar}>
      <div style={styles.left}>
        <span style={styles.dot} />
        <span style={styles.liveText}>
          {liveCount != null ? `${liveCount} bins reporting` : 'Connecting to backend...'}
        </span>
      </div>
      <div style={styles.right}>
        {lastRefresh && <span style={styles.refresh}>Updated {lastRefresh}</span>}
      </div>
    </header>
  )
}

const styles = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 32px', borderBottom: '1px solid var(--border-soft)',
    background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
  },
  left: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--status-empty)',
    boxShadow: '0 0 0 3px rgba(51,196,129,0.15)',
  },
  liveText: { fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  right: {},
  refresh: { fontSize: 12, color: 'var(--text-faint)' },
}
