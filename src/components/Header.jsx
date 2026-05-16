import { initials, avatarColor } from '../lib/constants'

const NAV_ITEMS = [
  { id: 'projects', label: 'Projects', icon: '📋' },
  { id: 'companies', label: 'Companies', icon: '🏢' },
  { id: 'pipeline', label: 'Pipeline', icon: '📊' },
  { id: 'activity', label: 'Activity', icon: '📝' },
  { id: 'funnel', label: 'Funnel', icon: '🔻' },
  { id: 'reports', label: 'Reports', icon: '📈' },
]

export default function Header({ currentUser, view, setView, onLogout, onSync, syncStatus, syncMsg, canManageTeam }) {
  const items = canManageTeam ? [...NAV_ITEMS, { id: 'team', label: 'Team', icon: '👥' }] : NAV_ITEMS
  const chipClass = { ok: 'sync-ok', syncing: 'sync-ing', error: 'sync-err', none: 'sync-none' }[syncStatus] || 'sync-none'

  return (
    <>
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
            <button key={n.id} className={`nav-btn ${n.id === view ? 'active' : 'inactive'}`} onClick={() => setView(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <span className={`sync-chip ${chipClass}`}>{syncMsg}</span>
          <button className="btn-ghost" onClick={onSync} title="Sync" style={{ fontSize: 18, minHeight: 44, minWidth: 44, justifyContent: 'center' }}>🔄</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 20, background: 'var(--bg)' }}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: avatarColor(currentUser.name) }}>{initials(currentUser.name)}</div>
            <div className="hide-mobile">
              <div style={{ fontSize: 12, fontWeight: 700 }}>{currentUser.name}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{currentUser.role}</div>
            </div>
          </div>
          <button className="btn-ghost" onClick={onLogout} title="Logout" style={{ fontSize: 18, minHeight: 44, minWidth: 44, justifyContent: 'center' }}>🚪</button>
        </div>
      </div>

      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {items.map(n => (
            <button
              key={n.id}
              className={`bottom-nav-btn ${n.id === view ? 'active' : ''}`}
              onClick={() => setView(n.id)}
            >
              <span className="bottom-nav-btn-icon">{n.icon}</span>
              <span className="bottom-nav-btn-label">{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}