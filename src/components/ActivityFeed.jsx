import { useState } from 'react'
import { fmt, initials, avatarColor, uid, ACT_TYPES } from '../lib/constants'
import Modal from './Modal'

export default function ActivityFeed({ data, currentUser, ops, visibleProjects, onOpenProject }) {
  const { activities, team, contacts, projects, regionalColleagues } = data
  const [modal, setModal] = useState(null)

  const sorted = activities
    .filter(a => visibleProjects.some(p => p.id === a.projectId))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 100)

  const openLog = () => setModal({ projectId: '', contactId: '', userId: currentUser.id, type: 'Call', date: new Date().toISOString().slice(0,10), note: '', rcIds: [] })

  const handleSave = async () => {
    if (!modal.projectId) return alert('Select a project')
    if (!modal.note.trim()) return alert('Note required')
    await ops.saveActivity({ ...modal, id: uid() })
    setModal(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Activity Feed</div>
        <button className="btn btn-primary" onClick={openLog}>+ Log Activity</button>
      </div>

      <div className="card card-pad">
        {!sorted.length && <div className="empty"><div className="empty-icon">📝</div><div>No activities yet.</div></div>}
        {sorted.map(a => {
          const actUser = team.find(u => u.id === a.userId)
          const proj = projects.find(p => p.id === a.projectId)
          const rcNames = (a.rcIds || []).map(id => regionalColleagues.find(r => r.id === id)?.name).filter(Boolean)
          return (
            <div key={a.id} className="activity-item">
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: avatarColor(actUser?.name || '') }}>{initials(actUser?.name || '?')}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <b style={{ fontSize: 12 }}>{actUser?.name || 'Unknown'}</b>
                  <span className="tag" style={{ background: 'var(--blue)', color: 'var(--blueD)' }}>{a.type}</span>
                  {proj && <span style={{ fontSize: 12, color: 'var(--blueD)', cursor: 'pointer' }} onClick={() => onOpenProject(proj.id)}>{proj.name}</span>}
                  {a.contactId && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{contacts.find(c => c.id === a.contactId)?.name}</span>}
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>{fmt(a.date)}</span>
                </div>
                <div className="activity-note">{a.note}</div>
                {rcNames.length > 0 && <div style={{ fontSize: 11, color: 'var(--sageD)', marginTop: 3 }}>With: {rcNames.join(', ')}</div>}
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">Log Activity</div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Project</div>
              <select className="inp" value={modal.projectId} onChange={e => setModal(m => ({ ...m, projectId: e.target.value }))}>
                <option value="">Select…</option>
                {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">Type</div>
              <select className="inp" value={modal.type} onChange={e => setModal(m => ({ ...m, type: e.target.value }))}>
                {ACT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Date</div>
              <input className="inp" type="date" value={modal.date} onChange={e => setModal(m => ({ ...m, date: e.target.value }))} />
            </div>
            <div className="field-wrap">
              <div className="field-label">Contact</div>
              <select className="inp" value={modal.contactId} onChange={e => setModal(m => ({ ...m, contactId: e.target.value }))}>
                <option value="">Select…</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field-wrap">
            <div className="field-label">Note</div>
            <textarea className="inp" rows={3} value={modal.note} onChange={e => setModal(m => ({ ...m, note: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
