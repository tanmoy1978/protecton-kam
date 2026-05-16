import { useState } from 'react'
import { cr, initials, avatarColor, projectCoatingsPotential, projectOpportunity, projectPOTotal, projectBestStage, poCaptureRate, uid, STAGES, PATH_TYPES, SECTORS, PROJ_STATUS, REGIONS, STAGE_COLORS, STAGE_TEXT } from '../lib/constants'
import Modal from './Modal'

export default function Projects({ data, currentUser, ops, canEdit, canDelete, visibleProjects, onOpenProject }) {
  const { scopes, team, companies, scopeBuyers } = data
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('All')
  const [filterRegion, setFilterRegion] = useState('All')
  const [filterStatus, setFilterStatus] = useState('Active')

  const activeP = visibleProjects.filter(p => p.status === 'Active')
  const totalPot = activeP.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
  const totalOpp = activeP.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
  const totalPO = activeP.reduce((x, p) => x + projectPOTotal(p.id, scopes, scopeBuyers), 0)
  const totalCR = poCaptureRate(totalOpp, totalPO)

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

  const openModal = (project = null) => setModal({
    id: project?.id || null,
    name: project?.name || '',
    status: project?.status || 'Active',
    region: project?.region || '',
    sector: project?.sector || '',
    pathType: project?.pathType || '',
    ownerId: project?.ownerId || '',
    epcId: project?.epcId || '',
    kamOwnerId: project?.kamOwnerId || currentUser.id,
    notes: project?.notes || '',
    expectedOrderDate: project?.expectedOrderDate || '',
  })

  const handleSave = async () => {
    if (!modal.name.trim()) return alert('Project name required')
    await ops.saveProject({ ...modal, id: modal.id || uid() })
    setModal(null)
  }

  const companyName = id => companies.find(c => c.id === id)?.name || '—'

  const crColor = (v) => v >= 60 ? 'var(--sageD)' : v >= 30 ? 'var(--strawD)' : 'var(--roseD)'
  const crBg = (v) => v >= 60 ? 'var(--sage)' : v >= 30 ? 'var(--straw)' : 'var(--rose)'

  return (
    <div>
      {/* ── SUMMARY STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <div className="stat-card" style={{ background: 'var(--blue)', gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div className="stat-val" style={{ color: 'var(--blueD)', fontSize: 32 }}>{activeP.length}</div>
            <div style={{ fontSize: 13, color: 'var(--blueD)', fontWeight: 600 }}>projects</div>
          </div>
          <div className="stat-label" style={{ color: 'var(--blueD)', marginTop: 4 }}>Active Portfolio</div>
          <div className="stat-sub" style={{ color: 'var(--blueD)' }}>{visibleProjects.length} total incl. inactive</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--straw)' }}>
          <div className="stat-val" style={{ color: 'var(--strawD)' }}>{cr(totalPot) || '—'}</div>
          <div className="stat-label" style={{ color: 'var(--strawD)', marginTop: 4 }}>Coatings Potential</div>
          <div className="stat-sub" style={{ color: 'var(--strawD)' }}>Total market size</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--lav)' }}>
          <div className="stat-val" style={{ color: 'var(--lavD)' }}>{totalOpp ? cr(totalOpp) : '—'}</div>
          <div className="stat-label" style={{ color: 'var(--lavD)', marginTop: 4 }}>Protecton Opportunity</div>
          <div className="stat-sub" style={{ color: 'var(--lavD)' }}>Addressable by Protecton</div>
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 8 }}>
          <div className="stat-card" style={{ background: '#B8E6CC', padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2D7A4F' }}>{totalPO ? cr(totalPO) : '—'}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2D7A4F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>POs Received</div>
              </div>
            </div>
          </div>
          <div className="stat-card" style={{ background: totalPO && totalOpp ? crBg(totalCR) : 'var(--slate)', padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: totalPO && totalOpp ? crColor(totalCR) : 'var(--slateD)' }}>{totalPO && totalOpp ? totalCR + '%' : '—'}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: totalPO && totalOpp ? crColor(totalCR) : 'var(--slateD)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Capture Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="inp" placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 2, minWidth: 160 }} />
        <select className="inp" value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ flex: 1, minWidth: 130 }}>
          <option value="All">All Stages</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="inp" value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ flex: 1, minWidth: 110 }}>
          <option value="All">All Regions</option>
          {REGIONS.filter(r => r !== 'All').map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="inp" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: 1, minWidth: 110 }}>
          <option value="All">All Status</option>
          {PROJ_STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        {canEdit && <button className="btn btn-primary" onClick={() => openModal()} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>+ New Project</button>}
      </div>

      {/* ── PROJECT LIST ── */}
      {!filtered.length && <div className="empty"><div className="empty-icon">📋</div><div>No projects found.</div></div>}
      {filtered.map(p => {
        const pot = projectCoatingsPotential(p.id, scopes)
        const opp = projectOpportunity(p.id, scopes)
        const pPO = projectPOTotal(p.id, scopes, scopeBuyers)
        const pCR = poCaptureRate(opp, pPO)
        const owner = team.find(u => u.id === p.kamOwnerId)
        const pScopes = scopes.filter(s => s.projectId === p.id)
        const stageSet = [...new Set(pScopes.map(s => s.stage).filter(Boolean))]
        const best = projectBestStage(p.id, scopes)
        const epc = companies.find(c => c.id === p.epcId)

        return (
          <div key={p.id} className="project-card" onClick={() => onOpenProject(p.id)}
            style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 8, cursor: 'pointer' }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {/* Left: all text info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name + actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', flex: 1, marginRight: 8 }}>{p.name}</div>
                  {canEdit && <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => openModal(p)}>edit</button>
                    {canDelete && <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px', color: 'var(--roseD)' }} onClick={() => { if (confirm('Delete project?')) ops.deleteProject(p.id) }}>del</button>}
                  </div>}
                </div>

                {/* Stage badges + path type */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                  {best && <span className="badge" style={{ background: STAGE_COLORS[best] || '#eee', color: STAGE_TEXT[best] || '#666', fontSize: 11, padding: '3px 10px' }}>
                    {best}{stageSet.length > 1 ? ` +${stageSet.length - 1}` : ''}
                  </span>}
                  {p.pathType && <span style={{ fontSize: 11, fontWeight: 600, color: p.pathType === 'Proactive' ? 'var(--lavD)' : 'var(--peachD)', background: p.pathType === 'Proactive' ? 'var(--lav)' : 'var(--peach)', padding: '2px 8px', borderRadius: 6 }}>{p.pathType}</span>}
                  {p.sector && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.sector}</span>}
                  {p.region && <span style={{ fontSize: 11, color: 'var(--muted)' }}>· {p.region}</span>}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                  {epc && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blueD)', background: 'var(--blue)', padding: '1px 5px', borderRadius: 4 }}>EPC</span>
                    {epc.name}
                  </span>}
                  {owner && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div className="avatar" style={{ width: 18, height: 18, fontSize: 8, background: avatarColor(owner.name) }}>{initials(owner.name)}</div>
                    <span style={{ fontWeight: 600 }}>{owner.name}</span>
                  </span>}
                  <span style={{ fontSize: 11 }}>{pScopes.length} scope{pScopes.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Right: value pills */}
              {(pot > 0 || opp > 0 || pPO > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
                  {pot > 0 && <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--strawD)', lineHeight: 1 }}>{cr(pot)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Potential</div>
                  </div>}
                  {opp > 0 && <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--lavD)', lineHeight: 1 }}>{cr(opp)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Opportunity</div>
                  </div>}
                  {pPO > 0 && <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#2D7A4F', lineHeight: 1 }}>{cr(pPO)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>POs · {pCR}%</div>
                  </div>}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* ── MODAL ── */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">{modal.id ? 'Edit Project' : 'New Project'}</div>
          <div className="field-wrap">
            <div className="field-label">Project Name</div>
            <input className="inp" value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} autoFocus />
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Status</div>
              <select className="inp" value={modal.status} onChange={e => setModal(m => ({ ...m, status: e.target.value }))}>
                {PROJ_STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
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
    </div>
  )
}