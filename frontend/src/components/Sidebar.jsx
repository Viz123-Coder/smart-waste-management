import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '◱' },
  { to: '/live-bins', label: 'Live Bins', icon: '⬢' },
  { to: '/map', label: 'Map', icon: '◎' },
  { to: '/predictions', label: 'AI Predictions', icon: '⌁' },
  { to: '/routes', label: 'Route Optimization', icon: '⤳' },
  { to: '/collections', label: 'Collections', icon: '☑' },
  { to: '/dumping', label: 'Illegal Dumping', icon: '⚠' },
  { to: '/alerts', label: 'Alerts', icon: '●' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  return (
    <aside className="app-sidebar" style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandMark}>CB</div>
        <div>
          <div style={styles.brandName}>ClearBin</div>
          <div style={styles.brandSub}>Waste Intelligence</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.footerLine}>Final Year Project</div>
        <div style={styles.footerLine}>ESP32 · Flask · Supabase</div>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    background: 'var(--panel)',
    borderRight: '1px solid var(--border-soft)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 14px',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 24px' },
  brandMark: {
    width: 34, height: 34, borderRadius: 8, background: 'var(--accent-soft)',
    color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13,
  },
  brandName: { fontWeight: 600, fontSize: 15 },
  brandSub: { fontSize: 11, color: 'var(--text-faint)' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 10px', borderRadius: 6, color: 'var(--text-muted)',
    fontSize: 13.5, fontWeight: 500,
  },
  navItemActive: {
    background: 'var(--accent-soft)', color: 'var(--accent)',
  },
  navIcon: { width: 16, display: 'inline-block', textAlign: 'center', opacity: 0.85 },
  footer: { padding: '14px 10px 4px', borderTop: '1px solid var(--border-soft)', marginTop: 12 },
  footerLine: { fontSize: 10.5, color: 'var(--text-faint)', lineHeight: 1.6 },
}
