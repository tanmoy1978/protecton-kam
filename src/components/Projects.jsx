import { useState } from 'react'
import { cr, initials, avatarColor, projectCoatingsPotential, projectOpportunity, projectPOTotal, projectBestStage, poCaptureRate, uid, STAGES, PATH_TYPES, PROJ_STATUS, REGIONS, STAGE_COLORS, STAGE_TEXT, PROJECT_TYPES, SECTOR_CYCLES } from '../lib/constants'
import Modal from './Modal'
import ProjectBriefModal from './ProjectBriefModal'

export default function Projects({ data, currentUser, ops, canEdit, canDelete, visibleProjects, onOpenProject }) {
  const { scopes, team, companies, scopeBuyers } = data
  const [modal, setModal] = useState(null)
  const [briefProject, setBriefProject] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('All')
  const [filterRegion, setFilterRegion] = useState('All')

  const activeP = visibleProjects.filter(p => p.status === 'Active')
  const totalPot = activeP.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
  const totalOpp = activeP.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
  const totalPO = activeP.reduce((x, p) => x + projectPOTotal(p.id, scopes, scopeBuyers), 0)
  const totalCR = poCaptureRate(totalOpp, totalPO)

  const [filterStatus, setFilterStatus] = useState('Active')
  const filtered = visibleProjects.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'All' && p.status !== filterStatus) return false
    if (filterRegion !== 'All' && p.region !== filterRegion) return false
    if (filterStage !== 'All') {
      const pScopes = scopes.filter(s => s.projectId === p.id)
      if (!pScopes.some(s => s.stage === filterStage)) return false
    }
    return true
  })

  const openModal = (project = null) => {
    setModal({
      id: project?.id || null,
      name: project?.name || '',
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
      {/* Stats — 2x2 grid + 5th card on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 16 }} className="stats-grid-5">
        <div className="stat-card" style={{ background: 'var(--blue)' }}>
          <div className="stat-val" style={{ color: 'var(--blueD)' }}>{activeP.length}</div>
          <div className="stat-label" style={{ color: 'var(--blueD)' }}>Projects</div>
          <div className="stat-sub" style={{ color: 'var(--blueD)' }}>{visibleProjects.length} total</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--straw)' }}>
          <div className="stat-val" style={{ color: 'var(--strawD)' }}>{cr(totalPot)}</div>
          <div className="stat-label" style={{ color: 'var(--strawD)' }}>Coatings Potential</div>
          <div className="stat-sub" style={{ color: 'var(--strawD)' }}>Total market</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--lav)' }}>
          <div className="stat-val" style={{ color: 'var(--lavD)' }}>{totalOpp ? cr(totalOpp) : '—'}</div>
          <div className="stat-label" style={{ color: 'var(--lavD)' }}>Protecton Opp.</div>
          <div className="stat-sub" style={{ color: 'var(--lavD)' }}>Addressable</div>
        </div>
        <div className="stat-card" style={{ background: '#B8E6CC' }}>
          <div className="stat-val" style={{ color: '#2D7A4F' }}>{totalPO ? cr(totalPO) : '—'}</div>
          <div className="stat-label" style={{ color: '#2D7A4F' }}>POs Received</div>
          <div className="stat-sub" style={{ color: '#2D7A4F' }}>Actual purchase orders</div>
        </div>
        <div className="stat-card" style={{ background: totalCR >= 60 ? 'var(--sage)' : totalCR >= 30 ? 'var(--straw)' : 'var(--rose)' }}>
          <div className="stat-val" style={{ color: totalCR >= 60 ? 'var(--sageD)' : totalCR >= 30 ? 'var(--strawD)' : 'var(--roseD)' }}>{totalPO && totalOpp ? totalCR + '%' : '—'}</div>
          <div className="stat-label" style={{ color: totalCR >= 60 ? 'var(--sageD)' : totalCR >= 30 ? 'var(--strawD)' : 'var(--roseD)' }}>Capture Rate</div>
          <div className="stat-sub" style={{ color: totalCR >= 60 ? 'var(--sageD)' : totalCR >= 30 ? 'var(--strawD)' : 'var(--roseD)' }}>POs ÷ Protecton Opp.</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="inp" placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
        <select className="inp" value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ flex: 1, minWidth: 120 }}>
          <option value="All">All Scope Stages</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="inp" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: 1, minWidth: 100 }}>
          <option value="All">All Status</option>
          {PROJ_STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="inp" value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ flex: 1, minWidth: 100 }}>
          <option value="All">All Regions</option>
          {REGIONS.filter(r => r !== 'All').map(r => <option key={r}>{r}</option>)}
        </select>
        {canEdit && <button className="btn btn-primary" onClick={() => openModal()} style={{ whiteSpace: 'nowrap' }}>+ New Project</button>}
      </div>

      {/* Project List */}
      {!filtered.length && <div className="empty"><div className="empty-icon">📋</div><div>No projects found.</div></div>}
      {filtered.map(p => {
        const pot = projectCoatingsPotential(p.id, scopes)
        const opp = projectOpportunity(p.id, scopes)
        const owner = team.find(u => u.id === p.kamOwnerId)
        return (
          <div key={p.id} className="project-card" onClick={() => onOpenProject(p.id)}>
            {/* Top row: name + edit/del */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 14, flex: 1, marginRight: 8 }}>{p.name}</div>
              {canEdit && <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn-ghost" style={{ fontSize: 12, color: 'var(--lavD)' }} onClick={() => setBriefProject(p)}>✨ brief</button>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => openModal(p)}>edit</button>
                {canDelete && <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { if (confirm('Delete project?')) ops.deleteProject(p.id) }}>del</button>}
              </div>}
            </div>

            {/* Badges — scope stages */}
            {(() => {
              const pScopes = scopes.filter(s => s.projectId === p.id)
              const stageSet = [...new Set(pScopes.map(s => s.stage).filter(Boolean))]
              const best = projectBestStage(p.id, scopes)
              return (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {best && <span className="badge" style={{ background: STAGE_COLORS[best] || '#eee', color: STAGE_TEXT[best] || '#666', fontSize: 10 }}>{best}{stageSet.length > 1 ? ` +${stageSet.length - 1} more` : ''}</span>}
                  {p.pathType && <span className="tag" style={{ background: p.pathType === 'Proactive' ? 'var(--lav)' : 'var(--peach)', color: p.pathType === 'Proactive' ? 'var(--lavD)' : 'var(--peachD)', fontSize: 10 }}>{p.pathType}</span>}
                </div>
              )
            })()}

            {/* Meta */}
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap', marginBottom: 10 }}>
              {p.sector && <span>{p.sector}</span>}
              {p.region && <span>{p.region}</span>}
              {p.epcId && <span>EPC: {companyName(p.epcId)}</span>}
              {owner && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div className="avatar" style={{ width: 14, height: 14, fontSize: 7, background: avatarColor(owner.name) }}>{initials(owner.name)}</div>
                {owner.name}
              </span>}
            </div>

            {/* Values row — full width, even spacing */}
            {(pot > 0 || opp > 0) && (
              <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                {pot > 0 && <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--strawD)' }}>{cr(pot)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>Potential</div>
                </div>}
                {opp > 0 && <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lavD)' }}>{cr(opp)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>Opportunity</div>
                </div>}
                {(() => {
                  const pPO = projectPOTotal(p.id, scopes, scopeBuyers)
                  const pCR = poCaptureRate(opp, pPO)
                  return (<>
                    {pPO > 0 && <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2D7A4F' }}>{cr(pPO)}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>POs</div>
                    </div>}
                    {pPO > 0 && opp > 0 && <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: pCR >= 60 ? 'var(--sageD)' : pCR >= 30 ? 'var(--strawD)' : 'var(--roseD)' }}>{pCR}%</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>Capture</div>
                    </div>}
                  </>)
                })()}
              </div>
            )}
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
          <div className="field-wrap">
            <div className="field-label">Status</div>
            <select className="inp" value={modal.status} onChange={e => setModal(m => ({ ...m, status: e.target.value }))}>
              {PROJ_STATUS.map(s => <option key={s}>{s}</option>)}
            </select>
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
                {sectors.map(s => <option key={s}>{s}</option>)}
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

          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Project Owner</div>
              <select className="inp" value={modal.ownerId} onChange={e => setModal(m => ({ ...m, ownerId: e.target.value }))}>
                <option value="">Select…</option>
                {companies.filter(c => c.type === 'Project Owner').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">EPC Contractor</div>
              <select className="inp" value={modal.epcId} onChange={e => setModal(m => ({ ...m, epcId: e.target.value }))}>
                <option value="">Select…</option>
                {companies.filter(c => c.type === 'EPC Contractor').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
      {briefProject && (
        <ProjectBriefModal
          project={briefProject}
          scopes={data.scopes.filter(s => s.projectId === briefProject.id)}
          activities={data.activities.filter(a => a.projectId === briefProject.id)}
          contacts={data.contacts}
          companies={data.companies}
          team={data.team}
          onClose={() => setBriefProject(null)}
        />
      )}

    </div>
  )
}