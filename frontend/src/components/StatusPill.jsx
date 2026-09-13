export default function StatusPill({ status }) {
  const cls = ['empty', 'medium', 'full', 'critical'].includes(status) ? status : 'unknown'
  return <span className={`status-pill status-${cls}`}>{status || 'unknown'}</span>
}
