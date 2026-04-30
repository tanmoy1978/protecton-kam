import { useState } from 'react'
import { fmt, initials, avatarColor, uid, CONTACT_ROLES, INFLUENCE } from '../lib/constants'
import Modal from './Modal'

export default function CompanyProfile({ data, ops, canEdit, canDelete, companyId, onBack, onOpenProject }) {
  const { companies, contacts, projects, activities } = data
  const company = companies.find(c => c.id === companyId)
  const [modal, setModal] = useState(null)

  if (!company) return <div><span className="back-link" onClick={onBack}>← Back</span><div>Company not found.</div></div>

  const coContacts = contacts.filter(c => c.companyId === companyId)
  const coProjects = projects.filter(p => p.ownerId === companyId || p.epcId === companyId)
  const coActs = activities.filter(a => coContacts.some(c => c.id === a.contactId)).sort((a,b) => new Date(b.date)-new Date(a.date))

  const openModal = (ct = null) => setModal({
    id: ct?.id || null, companyId, name: ct?.name || '', designation: ct?.designation || '',
    phone: ct?.phone || '', email: ct?.email || '', role: ct?.role || '', influence: ct?.influence || '', notes: ct?.notes || ''
  })

  const handleSave = async () => {
    if (!modal.name.trim()) return alert('Name required')
    await ops.saveContact({ ...modal, id: modal.id || uid() })
    setModal(null)
  }

  return (
    <div>
      <span className="back-link" onClick={onBack}>← Companies</span>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{company.name}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {company.type && <span className="tag" style={{ background: 'var(--blue)', color: 'var(--blueD)' }}>{company.type}</span>}
            {company.sector && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{company.sector}</span>}
            {company.city && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{company.city}</span>}
          </div>
        </div>
        {canEdit && <button className="btn btn-primary" onClick={() => openModal()}>+ Add Contact</button>}
      </div>

      <div className="grid3" style={{ marginBottom: 20 }}>
        <div className="card card-pad">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase' }}>Contacts</div>
          {!coContacts.length && <div style={{ fontSize: 12, color: 'var(--muted)' }}>None yet.</div>}
          {coContacts.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: avatarColor(c.name) }}>{initials(c.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.designation}</div>
              </div>
              {canEdit && <button className="btn-ghost" onClick={() => openModal(c)}>edit</button>}
              {canDelete && <button className="btn-ghost" onClick={() => { if (confirm('Delete?')) ops.deleteContact(c.id) }}>del</button>}
            </div>
          ))}
        </div>

        <div className="card card-pad">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase' }}>Projects</div>
          {!coProjects.length && <div style={{ fontSize: 12, color: 'var(--muted)' }}>None.</div>}
          {coProjects.map(p => (
            <div key={p.id} style={{ fontSize: 12, fontWeight: 600, color: 'var(--blueD)', cursor: 'pointer', marginBottom: 6 }} onClick={() => onOpenProject(p.id)}>{p.name}</div>
          ))}
        </div>

        <div className="card card-pad">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase' }}>Recent Activity</div>
          {!coActs.length && <div style={{ fontSize: 12, color: 'var(--muted)' }}>None.</div>}
          {coActs.slice(0,5).map(a => (
            <div key={a.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmt(a.date)} · {a.type}</div>
              <div style={{ fontSize: 12 }}>{a.note?.slice(0, 80)}</div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">{modal.id ? 'Edit Contact' : 'Add Contact'}</div>
          <div className="field-wrap"><div className="field-label">Name</div><input className="inp" value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} /></div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Designation</div><input className="inp" value={modal.designation} onChange={e => setModal(m => ({ ...m, designation: e.target.value }))} /></div>
            <div className="field-wrap"><div className="field-label">Role</div>
              <select className="inp" value={modal.role} onChange={e => setModal(m => ({ ...m, role: e.target.value }))}>
                <option value="">Select…</option>{CONTACT_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Phone</div><input className="inp" value={modal.phone} onChange={e => setModal(m => ({ ...m, phone: e.target.value }))} /></div>
            <div className="field-wrap"><div className="field-label">Email</div><input className="inp" value={modal.email} onChange={e => setModal(m => ({ ...m, email: e.target.value }))} /></div>
          </div>
          <div className="field-wrap"><div className="field-label">Influence</div>
            <select className="inp" value={modal.influence} onChange={e => setModal(m => ({ ...m, influence: e.target.value }))}>
              <option value="">Select…</option>{INFLUENCE.map(i => <option key={i}>{i}</option>)}
            </select>
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
