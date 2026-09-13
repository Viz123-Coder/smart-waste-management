export default function StatCard({ label, value, accentColor, sublabel }) {
  return (
    <div className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ ...styles.bar, background: accentColor || 'var(--accent)' }} />
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value}</div>
      {sublabel && <div style={styles.sublabel}>{sublabel}</div>}
    </div>
  )
}

const styles = {
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  label: { fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 },
  value: { fontSize: 30, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' },
  sublabel: { fontSize: 11.5, color: 'var(--text-faint)', marginTop: 6 },
}
