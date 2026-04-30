import { useState } from 'react'
import { cr, fmt, initials, avatarColor, scopeOpportunity, projectCoatingsPotential, projectOpportunity, projectWonValue, captureRate, uid, STAGES, SPEC_STATUS, PATH_TYPES, SECTORS, PROJ_STATUS, REGIONS, STAGE_COLORS, STAGE_TEXT } from '../lib/constants'
import Modal from './Modal'

export default function Projects({ data, currentUser, ops, canEdit, canDelete, visibleProjects, onOpenProject }) {
  const { scopes, team, companies } = data
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('All')
  const [filterRegion, setFilterRegion] = useState('All')

  const activeP = visibleProjects.filter(p => p.status === 'Active')
  const totalPot = activeP.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
  const wonProjects = activeP.filter(p => p.stage === 'Order Won')
  const oppProjects = activeP.filter(p => !['Order Won','Order Lost','Cancelled'].includes(p.stage))
  const totalOpp = oppProjects.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
  const totalWon = wonProjects.reduce((x, p) => x + projectWonValue(p.id, scopes), 0)

  const filtered = visibleProjects.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStage !== 'All' && p.stage !== filterStage) return false
    if (filterRegion !== 'All' && p.region !== filterRegion) return false
    return true
  })

  const openModal = (project = null) => {
    setModal({
      id: project?.id || null,
      name: project?.name || '',
      stage: project?.stage || 'Project Identified',
      status: project?.status || 'Active',
      region: project?.region || '',
      sector: project?.sector || '',
      pathType: project?.pathType || '',
      ownerId: project?.ownerId || '',
      epcId: project?.epcId || '',
      kamOwnerId: project?.kamOwnerId || currentUser.id,
      specStatus: project?.specStatus || 'Not Specified',
      notes: project?.notes || '',
      expectedOrderDate: project?.expectedOrderDate || '',
    })
  }

  const handleSave = async () => {
    if (!modal.name.trim()) return alert('Project name required')
    await ops.saveProject({ ...modal, id: modal.id || uid() })
    setModal(null)
  }

  const companyName = id => companies.find(c => c.id === id)?.name || '—'
  const userName = id => team.find(u => u.id === id)?.name || '—'

  return (
    <div>
      {/* Stats */}
      <div className="grid4">
        <div className="stat-card" style={{ background: 'var(--blue)' }}>
          <div className="stat-val" style={{ color: 'var(--blueD)' }}>{activeP.length} <span style={{ fontSize: 14 }}>projects</span></div>
          <div className="stat-label" style={{ color: 'var(--blueD)' }}>Total Projects</div>
          <div className="stat-sub" style={{ color: 'var(--blueD)' }}>{visibleProjects.length} total incl. inactive</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--straw)' }}>
          <div className="stat-val" style={{ color: 'var(--strawD)' }}>{cr(totalPot)}</div>
          <div className="stat-label" style={{ color: 'var(--strawD)' }}>Coatings Potential</div>
          <div className="stat-sub" style={{ color: 'var(--strawD)' }}>Total market across active projects</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--lav)' }}>
          <div className="stat-val" style={{ color: 'var(--lavD)' }}>{totalOpp ? cr(totalOpp) : '—'}</div>
          <div className="stat-label" style={{ color: 'var(--lavD)' }}>Protecton Opportunity</div>
          <div className="stat-sub" style={{ color: 'var(--lavD)' }}>Addressable by Protecton products</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--sage)' }}>
          <div className="stat-val" style={{ color: 'var(--sageD)' }}>{totalWon ? cr(totalWon) : '—'}</div>
          <div className="stat-label" style={{ color: 'var(--sageD)' }}>Orders Won</div>
          <div className="stat-sub" style={{ color: 'var(--sageD)' }}>{totalWon && totalOpp ? captureRate(totalOpp, totalWon) + '% capture rate' : 'Protecton orders won'}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="inp" placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
        <select className="inp" value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ width: 180 }}>
          <option value="All">All Stages</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="inp" value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ width: 140 }}>
          <option value="All">All Regions</option>
          {REGIONS.filter(r => r !== 'All').map(r => <option key={r}>{r}</option>)}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          {canEdit && <button className="btn btn-primary" onClick={() => openModal()}>+ New Project</button>}
        </div>
      </div>

      {/* Project List */}
      {!filtered.length && <div className="empty"><div className="empty-icon">📋</div><div>No projects found.</div></div>}
      {filtered.map(p => {
        const pot = projectCoatingsPotential(p.id, scopes)
        const opp = projectOpportunity(p.id, scopes)
        const won = projectWonValue(p.id, scopes)
        const owner = team.find(u => u.id === p.kamOwnerId)
        return (
          <div key={p.id} className="project-card" onClick={() => onOpenProject(p.id)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                  <span className="badge" style={{ background: STAGE_COLORS[p.stage] || '#eee', color: STAGE_TEXT[p.stage] || '#666', fontSize: 10 }}>{p.stage}</span>
                  {p.specStatus && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.specStatus}</span>}
                  {p.pathType && <span className="tag" style={{ background: p.pathType === 'Proactive' ? 'var(--lav)' : 'var(--peach)', color: p.pathType === 'Proactive' ? 'var(--lavD)' : 'var(--peachD)', fontSize: 10 }}>{p.pathType}</span>}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
                  {p.sector && <span>{p.sector}</span>}
                  {p.region && <span>{p.region}</span>}
                  {p.epcId && <span>EPC: {companyName(p.epcId)}</span>}
                  {owner && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div className="avatar" style={{ width: 16, height: 16, fontSize: 8, background: avatarColor(owner.name) }}>{initials(owner.name)}</div>{owner.name}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, textAlign: 'right' }}>
                {pot > 0 && <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--strawD)' }}>{cr(pot)}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>Potential</div></div>}
                {opp > 0 && <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lavD)' }}>{cr(opp)}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.stage === 'Order Won' ? 'Won' : 'Opportunity'}</div></div>}
                {p.stage === 'Order Won' && won > 0 && <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sageD)' }}>{captureRate(opp || pot, won)}%</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>Capture</div></div>}
              </div>
              {canEdit && <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
                <button className="btn-ghost" onClick={() => openModal(p)}>edit</button>
                {canDelete && <button className="btn-ghost" onClick={() => { if (confirm('Delete project?')) ops.deleteProject(p.id) }}>del</button>}
              </div>}
            </div>
          </div>
        )
      })}

      {/* Modal */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">{modal.id ? 'Edit Project' : 'New Project'}</div>
          <div className="field-wrap">
            <div className="field-label">Project Name</div>
            <input className="inp" value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Stage</div>
              <select className="inp" value={modal.stage} onChange={e => setModal(m => ({ ...m, stage: e.target.value }))}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">Status</div>
              <select className="inp" value={modal.status} onChange={e => setModal(m => ({ ...m, status: e.target.value }))}>
                {PROJ_STATUS.map(s => <option key={s}>{s}</option>)}
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
              <div className="field-label">Sector</div>
              <select className="inp" value={modal.sector} onChange={e => setModal(m => ({ ...m, sector: e.target.value }))}>
                <option value="">Select…</option>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Path Type</div>
              <select className="inp" value={modal.pathType} onChange={e => setModal(m => ({ ...m, pathType: e.target.value }))}>
                <option value="">Select…</option>
                {PATH_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">Spec Status</div>
              <select className="inp" value={modal.specStatus} onChange={e => setModal(m => ({ ...m, specStatus: e.target.value }))}>
                {SPEC_STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Project Owner</div>
              <select className="inp" value={modal.ownerId} onChange={e => setModal(m => ({ ...m, ownerId: e.target.value }))}>
                <option value="">Select…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">EPC Contractor</div>
              <select className="inp" value={modal.epcId} onChange={e => setModal(m => ({ ...m, epcId: e.target.value }))}>
                <option value="">Select…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">KAM Owner</div>
              <select className="inp" value={modal.kamOwnerId} onChange={e => setModal(m => ({ ...m, kamOwnerId: e.target.value }))}>
                <option value="">Select…</option>
                {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">Expected Order Date</div>
              <input className="inp" type="date" value={modal.expectedOrderDate || ''} onChange={e => setModal(m => ({ ...m, expectedOrderDate: e.target.value }))} />
            </div>
          </div>
          <div className="field-wrap">
            <div className="field-label">Notes</div>
            <textarea className="inp" rows={3} value={modal.notes} onChange={e => setModal(m => ({ ...m, notes: e.target.value }))} />
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
