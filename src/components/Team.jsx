import { useState } from 'react'
import { initials, avatarColor } from '../lib/constants'
import Modal from './Modal'

export default function Team({ data, ops }) {
  const { team } = data
  const [pinModal, setPinModal] = useState(null)
  const [newPin, setNewPin] = useState('')

  const handleSavePin = async () => {
    if (newPin.length < 4) return alert('PIN must be at least 4 digits')
    await ops.saveTeamMember({ ...pinModal, pin: newPin })
    setPinModal(null); setNewPin('')
  }

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Team</div>
      <div className="grid3">
        {team.filter(u => u.active).map(u => (
          <div key={u.id} className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="avatar" style={{ width: 44, height: 44, fontSize: 16, background: avatarColor(u.name) }}>{initials(u.name)}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.role}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.region}</div>
              </div>
            </div>
            <button className="btn btn-outline" style={{ width: '100%', fontSize: 11 }} onClick={() => { setPinModal(u); setNewPin('') }}>Change PIN</button>
          </div>
        ))}
      </div>

      {pinModal && (
        <Modal onClose={() => setPinModal(null)}>
          <div className="modal-title">Change PIN — {pinModal.name}</div>
          <div className="field-wrap">
            <div className="field-label">New PIN</div>
            <input className="inp" type="password" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="••••" style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSavePin}>Save PIN</button>
            <button className="btn btn-outline" onClick={() => setPinModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
