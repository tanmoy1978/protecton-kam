import { useState } from 'react'
import { initials, avatarColor, uid, REGIONS } from '../lib/constants'
import Modal from './Modal'

const ROLES = ['National KAM', 'Regional KAM', 'KAE']

export default function Team({ data, ops, canManageTeam }) {
  const { team } = data
  const [modal, setModal] = useState(null)

  const openAddModal = () => setModal({
    _type: 'member',
    id: null, name: '', role: 'KAE', region: 'All', pin: '1234', active: true
  })

  const openEditModal = (u) => setModal({
    _type: 'member',
    id: u.id, name: u.name, role: u.role, region: u.region, pin: u.pin, active: u.active
  })

  const openPinModal = (u) => setModal({
    _type: 'pin', id: u.id, name: u.name, newPin: ''
  })

  const handleSaveMember = async () => {
    if (!modal.name.trim()) return alert('Name required')
    if (!modal.pin || modal.pin.length < 4) return alert('PIN must be at least 4 digits')
    await ops.saveTeamMember({ ...modal, id: modal.id || uid() })
    setModal(null)
  }

  const handleSavePin = async () => {
    if (!modal.newPin || modal.newPin.length < 4) return alert('PIN must be at least 4 digits')
    const member = team.find(u => u.id === modal.id)
    await ops.saveTeamMember({ ...member, pin: modal.newPin })
    setModal(null)
  }

  const handleToggleActive = async (u) => {
    await ops.saveTeamMember({ ...u, active: !u.active })
  }

  const activeMembers = team.filter(u => u.active)
  const inactiveMembers = team.filter(u => !u.active)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Team</div>
        {canManageTeam && (
          <button className="btn btn-primary" onClick={openAddModal}>+ Add Member</button>
        )}
      </div>

      {/* Active Members */}
      <div className="grid3" style={{ marginBottom: 24 }}>
        {activeMembers.map(u => (
          <div key={u.id} className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="avatar" style={{ width: 48, height: 48, fontSize: 16, background: avatarColor(u.name) }}>{initials(u.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.role}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.region}</div>
              </div>
              {canManageTeam && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openEditModal(u)}>edit</button>
                  <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--roseD)' }} onClick={() => { if (confirm(`Deactivate ${u.name}?`)) handleToggleActive(u) }}>deactivate</button>
                </div>
              )}
            </div>
            <button className="btn btn-outline" style={{ width: '100%', fontSize: 11 }} onClick={() => openPinModal(u)}>
              Change PIN
            </button>
          </div>
        ))}
      </div>

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inactive</div>
          <div className="grid3">
            {inactiveMembers.map(u => (
              <div key={u.id} className="card card-pad" style={{ opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: '#ccc' }}>{initials(u.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.role} · {u.region}</div>
                  </div>
                  {canManageTeam && (
                    <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--sageD)' }} onClick={() => handleToggleActive(u)}>reactivate</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {modal?._type === 'member' && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">{modal.id ? 'Edit Team Member' : 'Add Team Member'}</div>
          <div className="field-wrap">
            <div className="field-label">Full Name</div>
            <input className="inp" value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} placeholder="e.g. Rajesh Kumar" />
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Role</div>
              <select className="inp" value={modal.role} onChange={e => setModal(m => ({ ...m, role: e.target.value }))}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">Region</div>
              <select className="inp" value={modal.region} onChange={e => setModal(m => ({ ...m, region: e.target.value }))}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {!modal.id && (
            <div className="field-wrap">
              <div className="field-label">Initial PIN</div>
              <input className="inp" type="password" maxLength={6} value={modal.pin} onChange={e => setModal(m => ({ ...m, pin: e.target.value }))} placeholder="Min 4 digits" style={{ fontSize: 20, letterSpacing: 6, textAlign: 'center' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" onClick={handleSaveMember}>Save</button>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Change PIN Modal */}
      {modal?._type === 'pin' && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">Change PIN — {modal.name}</div>
          <div className="field-wrap">
            <div className="field-label">New PIN</div>
            <input className="inp" type="password" maxLength={6} value={modal.newPin} onChange={e => setModal(m => ({ ...m, newPin: e.target.value }))} placeholder="Min 4 digits" autoFocus style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSavePin}>Save PIN</button>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
