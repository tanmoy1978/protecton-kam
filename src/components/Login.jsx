import { useState } from 'react'
import { initials, avatarColor } from '../lib/constants'

export default function Login({ team, onLogin }) {
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (!selected) return
    if (selected.pin === pin) {
      onLogin(selected)
    } else {
      setError('Incorrect PIN')
      setPin('')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'var(--blueD)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24, fontWeight: 800, color: '#fff' }}>P</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Protecton KAM</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Intelligence Platform</div>
        </div>

        {!selected ? (
          <div className="card card-pad">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select your profile</div>
            {team.filter(u => u.active).map(u => (
              <div key={u.id} onClick={() => setSelected(u)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, border: '1.5px solid var(--border)', background: '#fff', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blueD)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: avatarColor(u.name) }}>{initials(u.name)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.role} · {u.region}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 16 }}>›</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div className="avatar" style={{ width: 44, height: 44, fontSize: 15, background: avatarColor(selected.name) }}>{initials(selected.name)}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selected.role}</div>
              </div>
              <button className="btn-ghost" onClick={() => { setSelected(null); setPin(''); setError('') }} style={{ marginLeft: 'auto' }}>Change</button>
            </div>
            <div className="field-wrap">
              <div className="field-label">Enter PIN</div>
              <input className="inp" type="password" maxLength={6} value={pin} onChange={e => { setPin(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus placeholder="••••" style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }} />
            </div>
            {error && <div style={{ color: 'var(--roseD)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogin}>Login</button>
          </div>
        )}
      </div>
    </div>
  )
}
