import { initials, avatarColor } from '../lib/constants'

const NAV_ITEMS = [
  { id: 'projects', label: 'Projects' },
  { id: 'companies', label: 'Companies' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'activity', label: 'Activity' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'reports', label: 'Reports' },
]

export default function Header({ currentUser, view, setView, onLogout, onSync, syncStatus, syncMsg, canManageTeam }) {
  const items = canManageTeam ? [...NAV_ITEMS, { id: 'team', label: 'Team' }] : NAV_ITEMS
  const chipClass = { ok: 'sync-ok', syncing: 'sync-ing', error: 'sync-err', none: 'sync-none' }[syncStatus] || 'sync-none'

  return (
    <div className="header">
      <div className="logo">
        <div className="logo-icon">P</div>
        <div>
          <div className="logo-title">Protecton</div>
          <div className="logo-sub">KAM Intelligence</div>
        </div>
      </div>
      <nav className="nav">
        {items.map(n => (
          <button key={n.id} className={`nav-btn ${n.id === view ? 'active' : 'inactive'}`} onClick={() => setView(n.id)}>{n.label}</button>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`sync-chip ${chipClass}`}>{syncMsg}</span>
        <button className="btn-ghost" onClick={onSync} title="Sync" style={{ fontSize: 16 }}>🔄</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 20, background: 'var(--bg)' }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: avatarColor(currentUser.name) }}>{initials(currentUser.name)}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{currentUser.name}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{currentUser.role}</div>
          </div>
        </div>
        <button className="btn-ghost" onClick={onLogout} title="Logout" style={{ fontSize: 16 }}>🚪</button>
      </div>
    </div>
  )
}
