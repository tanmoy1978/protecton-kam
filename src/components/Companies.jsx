import { useState } from 'react'
import { uid, COMPANY_TYPES, SECTORS, REGIONS } from '../lib/constants'
import Modal from './Modal'

export default function Companies({ data, ops, canEdit, canDelete, onOpenCompany }) {
  const { companies, contacts } = data
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = companies.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()))

  const openModal = (co = null) => setModal({
    id: co?.id || null, name: co?.name || '', type: co?.type || '', sector: co?.sector || '',
    region: co?.region || '', city: co?.city || '', phone: co?.phone || '', email: co?.email || '', notes: co?.notes || ''
  })

  const handleSave = async () => {
    if (!modal.name.trim()) return alert('Name required')
    await ops.saveCompany({ ...modal, id: modal.id || uid() })
    setModal(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input className="inp" placeholder="Search companies…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260 }} />
        <div style={{ marginLeft: 'auto' }}>
          {canEdit && <button className="btn btn-primary" onClick={() => openModal()}>+ Add Company</button>}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr><th>Company</th><th>Type</th><th>Sector</th><th>Region / City</th><th>Contacts</th><th></th></tr></thead>
          <tbody>
            {!filtered.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No companies yet.</td></tr>}
            {filtered.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--blueD)' }} onClick={() => onOpenCompany(c.id)}>{c.name}</td>
                <td><span className="tag" style={{ background: 'var(--blue)', color: 'var(--blueD)', fontSize: 10 }}>{c.type || '—'}</span></td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.sector || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{[c.region, c.city].filter(Boolean).join(' / ') || '—'}</td>
                <td style={{ fontSize: 12 }}>{contacts.filter(ct => ct.companyId === c.id).length}</td>
                <td>
                  {canEdit && <button className="btn-ghost" onClick={() => openModal(c)}>edit</button>}
                  {canDelete && <button className="btn-ghost" onClick={() => { if (confirm('Delete?')) ops.deleteCompany(c.id) }}>del</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">{modal.id ? 'Edit Company' : 'Add Company'}</div>
          <div className="field-wrap">
            <div className="field-label">Company Name</div>
            <input className="inp" value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Type</div>
              <select className="inp" value={modal.type} onChange={e => setModal(m => ({ ...m, type: e.target.value }))}>
                <option value="">Select…</option>
                {COMPANY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">Sector</div>
              <select className="inp" value={modal.sector} onChange={e => setModal(m => ({ ...m, sector: e.target.value }))}>
                <option value="">Select…</option>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Region</div>
              <select className="inp" value={modal.region} onChange={e => setModal(m => ({ ...m, region: e.target.value }))}>
                <option value="">Select…</option>
                {REGIONS.filter(r => r !== 'All').map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">City</div>
              <input className="inp" value={modal.city} onChange={e => setModal(m => ({ ...m, city: e.target.value }))} />
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Phone</div>
              <input className="inp" value={modal.phone} onChange={e => setModal(m => ({ ...m, phone: e.target.value }))} />
            </div>
            <div className="field-wrap">
              <div className="field-label">Email</div>
              <input className="inp" value={modal.email} onChange={e => setModal(m => ({ ...m, email: e.target.value }))} />
            </div>
          </div>
          <div className="field-wrap">
            <div className="field-label">Notes</div>
            <textarea className="inp" rows={2} value={modal.notes} onChange={e => setModal(m => ({ ...m, notes: e.target.value }))} />
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
