import { useState } from 'react'
import { cr, fmt, initials, avatarColor, uid, scopeOpportunity, scopeProtecton, projectCoatingsPotential, projectOpportunity, projectWonValue, projectPOTotal, captureRate, STAGES, SPEC_STATUS, SCOPE_TYPES, DATA_SOURCES, PROD_STATUS, QTY_UNITS, ACT_TYPES, STAGE_COLORS, STAGE_TEXT } from '../lib/constants'
import Modal from './Modal'

export default function ProjectProfile({ data, currentUser, ops, canEdit, canDelete, projectId, onBack }) {
  const { projects, scopes, activities, contacts, team, companies, regionalColleagues, scopeBuyers, scopeStakeholders } = data
  const [tab, setTab] = useState('scopes')
  const [modal, setModal] = useState(null)

  const p = projects.find(x => x.id === projectId)
  if (!p) return <div><span className="back-link" onClick={onBack}>← Back</span><div>Project not found.</div></div>

  const pScopes = scopes.filter(s => s.projectId === projectId)
  const pActs = activities.filter(a => a.projectId === projectId).sort((a,b) => new Date(b.date)-new Date(a.date))
  const isWon = p.stage === 'Order Won'
  const pot = projectCoatingsPotential(projectId, scopes)
  const opp = projectOpportunity(projectId, scopes)
  const won = projectWonValue(projectId, scopes)
  const poTotal = projectPOTotal(projectId, scopes, scopeBuyers)
  const cr_ = isWon ? captureRate(opp || pot, won) : 0

  const companyName = id => companies.find(c => c.id === id)?.name || '—'
  const userName = id => team.find(u => u.id === id)?.name || '—'

  const openEditProject = () => setModal({
    _type: 'editproject',
    id: p.id, name: p.name, stage: p.stage, status: p.status || 'Active',
    region: p.region || '', sector: p.sector || '', pathType: p.pathType || '',
    ownerId: p.ownerId || '', epcId: p.epcId || '', kamOwnerId: p.kamOwnerId || '',
    specStatus: p.specStatus || 'Not Specified', notes: p.notes || '',
    expectedOrderDate: p.expectedOrderDate || ''
  })

  const openScopeModal = (sc = null) => setModal({
    _type: 'scope',
    id: sc?.id || null,
    name: sc?.name || sc?.type || '',
    type: sc?.type || '',
    dataSource: sc?.dataSource || '',
    scopeValue: sc?.scopeValue || '',
    coatingsPotential: sc?.coatingsPotential || '',
    protectonOpportunity: sc?.protectonOpportunity || '',
    qty: sc?.qty || '',
    qtyUnit: sc?.qtyUnit || '',
    notes: sc?.notes || '',
    products: sc?.products || [],
  })

  const saveScope = async () => {
    if (!modal.name.trim()) return alert('Scope name required')
    await ops.saveScope({
      ...modal,
      id: modal.id || uid(),
      projectId,
      coatingsPotential: parseFloat(modal.coatingsPotential) || 0,
      protectonOpportunity: parseFloat(modal.protectonOpportunity) || 0,
      scopeValue: parseFloat(modal.scopeValue) || 0,
      qty: parseFloat(modal.qty) || null
    })
    setModal(null)
  }

  const openProductModal = (scopeId, pr = null) => setModal({
    _type: 'product', scopeId,
    id: pr?.id || null, name: pr?.name || '', valueL: pr?.valueL || '', status: pr?.status || 'Proposed'
  })

  const saveProduct = async () => {
    if (!modal.name.trim()) return alert('Product name required')
    const pr = { id: modal.id || uid(), name: modal.name, valueL: parseFloat(modal.valueL) || 0, status: modal.status }
    const sc = scopes.find(s => s.id === modal.scopeId)
    if (!sc) return
    const products = modal.id ? sc.products.map(x => x.id === modal.id ? pr : x) : [...(sc.products || []), pr]
    await ops.saveScope({ ...sc, products })
    setModal(null)
  }

  const openStakeholderModal = (scopeId, sk = null) => setModal({
    _type: 'stakeholder', scopeId,
    id: sk?.id || null, contactId: sk?.contactId || '', role: sk?.role || '', influence: sk?.influence || '', notes: sk?.notes || ''
  })

  const saveStakeholder = async () => {
    if (!modal.contactId) return alert('Select a contact')
    await ops.saveScopeStakeholder({ ...modal, id: modal.id || uid(), scopeId: modal.scopeId })
    setModal(null)
  }

  const openBuyerModal = (scopeId, b = null) => setModal({
    _type: 'buyer', scopeId,
    id: b?.id || null, companyId: b?.companyId || '', subletById: b?.subletById || '', pos: b?.pos || []
  })

  const saveBuyer = async () => {
    if (!modal.companyId) return alert('Select a buyer company')
    await ops.saveScopeBuyer({ ...modal, id: modal.id || uid(), scopeId: modal.scopeId })
    setModal(null)
  }

  const addPORow = () => setModal(m => ({ ...m, pos: [...(m.pos||[]), { id: uid(), number: '', date: '', value: '', notes: '' }] }))
  const updatePO = (idx, field, val) => setModal(m => ({ ...m, pos: m.pos.map((po, i) => i === idx ? { ...po, [field]: val } : po) }))
  const removePO = (idx) => setModal(m => ({ ...m, pos: m.pos.filter((_, i) => i !== idx) }))

  const openActivityModal = () => setModal({
    _type: 'activity',
    userId: currentUser.id, contactId: '', type: 'Call',
    date: new Date().toISOString().slice(0, 10), note: '', rcIds: []
  })

  const saveActivity = async () => {
    if (!modal.note.trim()) return alert('Note required')
    await ops.saveActivity({ ...modal, id: uid(), projectId })
    setModal(null)
  }

  return (
    <div>
      <span className="back-link" onClick={onBack}>← Projects</span>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{p.name}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: STAGE_COLORS[p.stage] || '#eee', color: STAGE_TEXT[p.stage] || '#666' }}>{p.stage}</span>
            {p.specStatus && <span className="tag" style={{ background: 'var(--straw)', color: 'var(--strawD)' }}>{p.specStatus}</span>}
            {p.pathType && <span className="tag" style={{ background: p.pathType === 'Proactive' ? 'var(--lav)' : 'var(--peach)', color: p.pathType === 'Proactive' ? 'var(--lavD)' : 'var(--peachD)' }}>{p.pathType}</span>}
            {p.kamOwnerId && <span className="tag" style={{ background: 'var(--blue)', color: 'var(--blueD)' }}>KAM: {userName(p.kamOwnerId)}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && <button className="btn btn-outline" onClick={openEditProject}>Edit</button>}
          <button className="btn btn-primary" onClick={openActivityModal}>+ Log Activity</button>
        </div>
      </div>

      <div className="grid4" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ background: 'var(--straw)' }}>
          <div className="stat-val" style={{ color: 'var(--strawD)' }}>{cr(pot) || '—'}</div>
          <div className="stat-label" style={{ color: 'var(--strawD)' }}>Coatings Potential</div>
          <div className="stat-sub" style={{ color: 'var(--strawD)' }}>Total market for coatings</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--lav)' }}>
          <div className="stat-val" style={{ color: 'var(--lavD)' }}>{cr(opp) || '—'}</div>
          <div className="stat-label" style={{ color: 'var(--lavD)' }}>Protecton Opportunity</div>
          <div className="stat-sub" style={{ color: 'var(--lavD)' }}>Addressable by Protecton products</div>
        </div>
        <div className="stat-card" style={{ background: isWon ? 'var(--sage)' : 'var(--slate)' }}>
          <div className="stat-val" style={{ color: isWon ? 'var(--sageD)' : 'var(--slateD)' }}>{isWon ? (cr(won) || '—') : '—'}</div>
          <div className="stat-label" style={{ color: isWon ? 'var(--sageD)' : 'var(--slateD)' }}>Orders Won</div>
          <div className="stat-sub" style={{ color: isWon ? 'var(--sageD)' : 'var(--slateD)' }}>{isWon ? (cr_ + '% capture rate') : 'Available when order is won'}</div>
        </div>
        <div className="stat-card" style={{ background: isWon ? '#B8E6CC' : 'var(--slate)' }}>
          <div className="stat-val" style={{ color: isWon ? '#2D7A4F' : 'var(--slateD)' }}>{isWon ? (cr(poTotal) || '—') : '—'}</div>
          <div className="stat-label" style={{ color: isWon ? '#2D7A4F' : 'var(--slateD)' }}>POs Received</div>
          <div className="stat-sub" style={{ color: isWon ? '#2D7A4F' : 'var(--slateD)' }}>{isWon ? (poTotal < won ? `${cr(won - poTotal)} pending` : 'Fully released') : 'Available when order is won'}</div>
        </div>
      </div>

      <div className="tabs">
        {[{id:'scopes',label:'Scopes and Values'},{id:'activity',label:'Activity Log'},{id:'details',label:'Details'}].map(t =>
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        )}
      </div>

      {tab === 'scopes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {pScopes.length} scope{pScopes.length !== 1 ? 's' : ''} — Potential: <b>{cr(pot) || '—'}</b>
              {opp > 0 && <> — Opportunity: <b style={{ color: 'var(--lavD)' }}>{cr(opp)}</b></>}
              {isWon && won > 0 && <> — Won: <b style={{ color: 'var(--sageD)' }}>{cr(won)}</b> — Capture: <b>{captureRate(opp || pot, won)}%</b></>}
              {poTotal > 0 && <> — POs: <b style={{ color: '#2D7A4F' }}>{cr(poTotal)}</b></>}
            </div>
            {canEdit && <button className="btn btn-primary" onClick={() => openScopeModal()}>+ Add Scope</button>}
          </div>

          {!pScopes.length && <div className="empty"><div className="empty-icon">📦</div><div>No scopes yet.</div></div>}

          {pScopes.map(sc => {
            const sPot = sc.coatingsPotential || 0
            const sOpp = scopeOpportunity(sc)
            const sWon = scopeProtecton(sc)
            const sCr = isWon ? captureRate(sOpp || sPot, sWon) : 0
            const sBuyers = scopeBuyers.filter(b => b.scopeId === sc.id)
            const sPOTotal = sBuyers.reduce((x, b) => (b.pos || []).reduce((y, po) => y + (parseFloat(po.value) || 0), 0) + x, 0)

            return (
              <div key={sc.id} className="scope-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{sc.name || sc.type}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sc.type}{sc.dataSource ? ' · ' + sc.dataSource : ''}</div>
                  </div>
                  {canEdit && <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-ghost" onClick={() => openScopeModal(sc)}>edit</button>
                    {canDelete && <button className="btn-ghost" onClick={() => { if (confirm('Delete scope?')) ops.deleteScope(sc.id) }}>del</button>}
                  </div>}
                </div>

                <div className="scope-values">
                  <div className="scope-val-box">
                    <div className="scope-val-num" style={{ color: 'var(--strawD)' }}>{cr(sPot) || '—'}</div>
                    <div className="scope-val-label">Coatings Potential</div>
                  </div>
                  <div className="scope-val-box">
                    <div className="scope-val-num" style={{ color: 'var(--lavD)' }}>{cr(sOpp) || '—'}</div>
                    <div className="scope-val-label">Protecton Opportunity</div>
                  </div>
                  <div className="scope-val-box">
                    <div className="scope-val-num" style={{ color: isWon ? 'var(--sageD)' : '#B0BEC5' }}>{isWon ? (cr(sWon) || '—') : '—'}</div>
                    <div className="scope-val-label">Orders Won</div>
                  </div>
                  <div className="scope-val-box">
                    <div className="scope-val-num" style={{ color: isWon ? '#2D7A4F' : '#B0BEC5' }}>{isWon ? (cr(sPOTotal) || '—') : '—'}</div>
                    <div className="scope-val-label">POs Received</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>PRODUCTS</div>
                {(sc.products || []).map(pr => (
                  <div key={pr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fff', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 4, gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{pr.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lavD)' }}>{cr(pr.valueL)}</span>
                    <span className="tag" style={{ background: pr.status === 'Specified' ? 'var(--sage)' : pr.status === 'Lost' ? 'var(--rose)' : 'var(--straw)', color: pr.status === 'Specified' ? 'var(--sageD)' : pr.status === 'Lost' ? 'var(--roseD)' : 'var(--strawD)', fontSize: 10 }}>{pr.status}</span>
                    {canEdit && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openProductModal(sc.id, pr)}>edit</button>}
                    {canDelete && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { if (confirm('Remove?')) ops.saveScope({ ...sc, products: sc.products.filter(x => x.id !== pr.id) }) }}>del</button>}
                  </div>
                ))}
                {!(sc.products || []).length && <div style={{ fontSize: 12, color: '#A0AEC0', padding: '4px 0' }}>No products yet.</div>}
                {canEdit && <button className="btn-sm" style={{ background: 'var(--lav)', color: 'var(--lavD)', marginTop: 6 }} onClick={() => openProductModal(sc.id)}>+ Add Product</button>}

                {/* Stakeholders Section */}
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>SCOPE STAKEHOLDERS</div>
                    {canEdit && <button className="btn-sm" style={{ background: 'var(--peach)', color: 'var(--peachD)' }} onClick={() => openStakeholderModal(sc.id)}>+ Add Stakeholder</button>}
                  </div>
                  {scopeStakeholders.filter(sk => sk.scopeId === sc.id).length === 0 && <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 4 }}>No stakeholders linked yet.</div>}
                  {scopeStakeholders.filter(sk => sk.scopeId === sc.id).map(sk => {
                    const ct = contacts.find(c => c.id === sk.contactId)
                    const co = ct ? companies.find(c => c.id === ct.companyId) : null
                    return (
                      <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#FFF8F5', border: '1px solid #F5D9CC', borderRadius: 8, marginBottom: 6 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{ct?.name || '—'}</span>
                          {co && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>{co.name}</span>}
                          {sk.role && <span className="tag" style={{ background: 'var(--peach)', color: 'var(--peachD)', fontSize: 10, marginLeft: 8 }}>{sk.role}</span>}
                          {sk.influence && <span style={{ fontSize: 11, color: sk.influence === 'High' ? 'var(--roseD)' : sk.influence === 'Medium' ? 'var(--strawD)' : 'var(--muted)', marginLeft: 6 }}>● {sk.influence}</span>}
                        </div>
                        {canEdit && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openStakeholderModal(sc.id, sk)}>edit</button>}
                        {canDelete && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { if (confirm('Remove?')) ops.deleteScopeStakeholder(sk.id) }}>del</button>}
                      </div>
                    )
                  })}
                </div>

                {/* Buyers & POs Section */}
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>BUYERS & PURCHASE ORDERS</div>
                    {canEdit && <button className="btn-sm" style={{ background: 'var(--blue)', color: 'var(--blueD)' }} onClick={() => openBuyerModal(sc.id)}>+ Add Buyer</button>}
                  </div>
                  {!sBuyers.length && <div style={{ fontSize: 12, color: '#A0AEC0' }}>No buyers added yet.</div>}
                  {sBuyers.map(b => {
                    const bPOTotal = (b.pos || []).reduce((x, po) => x + (parseFloat(po.value) || 0), 0)
                    return (
                      <div key={b.id} style={{ background: '#F8FAFF', border: '1px solid #E0E8F5', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{companyName(b.companyId)}</span>
                            {b.subletById && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>sublet by {companyName(b.subletById)}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#2D7A4F' }}>{cr(bPOTotal) || '—'} PO</span>
                            {canEdit && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openBuyerModal(sc.id, b)}>edit</button>}
                            {canDelete && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { if (confirm('Delete buyer?')) ops.deleteScopeBuyer(b.id) }}>del</button>}
                          </div>
                        </div>
                        {(b.pos || []).length > 0 ? (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                            <thead><tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                              <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600 }}>PO Number</th>
                              <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600 }}>Date</th>
                              <th style={{ textAlign: 'right', padding: '3px 6px', fontWeight: 600 }}>Value</th>
                              <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600 }}>Notes</th>
                            </tr></thead>
                            <tbody>
                              {(b.pos || []).map((po, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #F0F4FA' }}>
                                  <td style={{ padding: '4px 6px', fontWeight: 600 }}>{po.number || '—'}</td>
                                  <td style={{ padding: '4px 6px', color: 'var(--muted)' }}>{fmt(po.date)}</td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: '#2D7A4F' }}>{cr(parseFloat(po.value))}</td>
                                  <td style={{ padding: '4px 6px', color: 'var(--muted)' }}>{po.notes || ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : <div style={{ fontSize: 11, color: '#A0AEC0' }}>No POs logged yet.</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'activity' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{pActs.length} activities</div>
            <button className="btn btn-primary" onClick={openActivityModal}>+ Log Activity</button>
          </div>
          {!pActs.length && <div className="empty"><div className="empty-icon">📝</div><div>No activities yet.</div></div>}
          <div className="card card-pad">
            {pActs.map(a => {
              const actUser = team.find(u => u.id === a.userId)
              const rcNames = (a.rcIds || []).map(id => regionalColleagues.find(r => r.id === id)?.name).filter(Boolean)
              return (
                <div key={a.id} className="activity-item">
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: avatarColor(actUser?.name || '') }}>{initials(actUser?.name || '?')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <b style={{ fontSize: 12 }}>{actUser?.name || 'Unknown'}</b>
                      <span className="tag" style={{ background: 'var(--blue)', color: 'var(--blueD)' }}>{a.type}</span>
                      {a.contactId && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{contacts.find(c => c.id === a.contactId)?.name}</span>}
                      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>{fmt(a.date)}</span>
                    </div>
                    <div className="activity-note">{a.note}</div>
                    {rcNames.length > 0 && <div style={{ fontSize: 11, color: 'var(--sageD)', marginTop: 3 }}>With: {rcNames.join(', ')}</div>}
                  </div>
                  {canDelete && <button className="btn-ghost" onClick={() => { if (confirm('Delete?')) ops.deleteActivity(a.id) }}>del</button>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'details' && (
        <div className="card card-pad">
          <div className="grid2">
            {[['Sector', p.sector], ['Region', p.region], ['Status', p.status], ['Path Type', p.pathType], ['Project Owner', companyName(p.ownerId)], ['EPC', companyName(p.epcId)], ['Expected Order Date', fmt(p.expectedOrderDate)], ['KAM', userName(p.kamOwnerId)]].map(([label, val]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontSize: 13, marginTop: 3 }}>{val || '—'}</div>
              </div>
            ))}
          </div>
          {p.notes && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>{p.notes}</div>}
        </div>
      )}

      {/* ── MODALS ── */}

      {modal?._type === 'editproject' && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">Edit Project</div>
          <div className="field-wrap"><div className="field-label">Project Name</div>
            <input className="inp" value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Stage</div>
              <select className="inp" value={modal.stage} onChange={e => setModal(m => ({ ...m, stage: e.target.value }))}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field-wrap"><div className="field-label">Spec Status</div>
              <select className="inp" value={modal.specStatus} onChange={e => setModal(m => ({ ...m, specStatus: e.target.value }))}>
                {SPEC_STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Region</div>
              <select className="inp" value={modal.region} onChange={e => setModal(m => ({ ...m, region: e.target.value }))}>
                <option value="">Select…</option>
                {['West','South','North','East'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="field-wrap"><div className="field-label">Sector</div>
              <select className="inp" value={modal.sector} onChange={e => setModal(m => ({ ...m, sector: e.target.value }))}>
                <option value="">Select…</option>
                {['Oil & Gas','Power','Fertilizer','Steel','Water & Wastewater','Data Centers','Infrastructure','Petrochemical','Refinery','Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Project Owner</div>
              <select className="inp" value={modal.ownerId} onChange={e => setModal(m => ({ ...m, ownerId: e.target.value }))}>
                <option value="">Select…</option>
                {companies.filter(c => c.type === 'Project Owner').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field-wrap"><div className="field-label">EPC</div>
              <select className="inp" value={modal.epcId} onChange={e => setModal(m => ({ ...m, epcId: e.target.value }))}>
                <option value="">Select…</option>
                {companies.filter(c => c.type === 'EPC Contractor').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">KAM Owner</div>
              <select className="inp" value={modal.kamOwnerId} onChange={e => setModal(m => ({ ...m, kamOwnerId: e.target.value }))}>
                <option value="">Select…</option>
                {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="field-wrap"><div className="field-label">Path Type</div>
              <select className="inp" value={modal.pathType} onChange={e => setModal(m => ({ ...m, pathType: e.target.value }))}>
                <option value="">Select…</option>
                <option>Proactive</option><option>Reactive</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Status</div>
              <select className="inp" value={modal.status} onChange={e => setModal(m => ({ ...m, status: e.target.value }))}>
                {['Active','On Hold','Cancelled','Completed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field-wrap"><div className="field-label">Expected Order Date</div>
              <input className="inp" type="date" value={modal.expectedOrderDate || ''} onChange={e => setModal(m => ({ ...m, expectedOrderDate: e.target.value }))} />
            </div>
          </div>
          <div className="field-wrap"><div className="field-label">Notes</div>
            <textarea className="inp" rows={3} value={modal.notes} onChange={e => setModal(m => ({ ...m, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={async () => { await ops.saveProject(modal); setModal(null) }}>Save</button>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {modal?._type === 'scope' && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">{modal.id ? 'Edit Scope' : 'Add Scope'}</div>
          <div className="field-wrap"><div className="field-label">Scope Name</div>
            <input className="inp" value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Type</div>
              <select className="inp" value={modal.type} onChange={e => setModal(m => ({ ...m, type: e.target.value, name: m.name || e.target.value }))}>
                <option value="">Select…</option>{SCOPE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-wrap"><div className="field-label">Data Source</div>
              <select className="inp" value={modal.dataSource} onChange={e => setModal(m => ({ ...m, dataSource: e.target.value }))}>
                <option value="">Select…</option>{DATA_SOURCES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Coatings Potential (L)</div>
              <input className="inp" type="number" value={modal.coatingsPotential} onChange={e => setModal(m => ({ ...m, coatingsPotential: e.target.value }))} />
            </div>
            <div className="field-wrap"><div className="field-label">Protecton Opportunity (L)</div>
              <input className="inp" type="number" value={modal.protectonOpportunity} onChange={e => setModal(m => ({ ...m, protectonOpportunity: e.target.value }))} placeholder="Leave blank = auto from products" />
            </div>
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Quantity</div>
              <input className="inp" type="number" value={modal.qty} onChange={e => setModal(m => ({ ...m, qty: e.target.value }))} />
            </div>
            <div className="field-wrap"><div className="field-label">Unit</div>
              <select className="inp" value={modal.qtyUnit} onChange={e => setModal(m => ({ ...m, qtyUnit: e.target.value }))}>
                <option value="">Select…</option>{QTY_UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="field-wrap"><div className="field-label">Notes</div>
            <textarea className="inp" rows={2} value={modal.notes} onChange={e => setModal(m => ({ ...m, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={saveScope}>Save</button>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {modal?._type === 'product' && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">{modal.id ? 'Edit Product' : 'Add Product'}</div>
          <div className="field-wrap"><div className="field-label">Product Name</div>
            <input className="inp" value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Value (Lakhs)</div>
              <input className="inp" type="number" value={modal.valueL} onChange={e => setModal(m => ({ ...m, valueL: e.target.value }))} />
            </div>
            <div className="field-wrap"><div className="field-label">Status</div>
              <select className="inp" value={modal.status} onChange={e => setModal(m => ({ ...m, status: e.target.value }))}>
                {PROD_STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={saveProduct}>Save</button>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {modal?._type === 'buyer' && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">{modal.id ? 'Edit Buyer' : 'Add Buyer'}</div>
          <div className="field-wrap"><div className="field-label">Buyer Company</div>
            <select className="inp" value={modal.companyId} onChange={e => setModal(m => ({ ...m, companyId: e.target.value }))}>
              <option value="">Select buyer…</option>
              {companies.filter(c => ['EPC Contractor','Fabricator','Subcontractor'].includes(c.type)).sort((a,b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <div className="field-label">Sublet by (EPC) <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>— which EPC sublet this to the buyer</span></div>
            <select className="inp" value={modal.subletById} onChange={e => setModal(m => ({ ...m, subletById: e.target.value }))}>
              <option value="">Direct / Not applicable</option>
              {companies.filter(c => c.type === 'EPC Contractor').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>PURCHASE ORDERS</div>
              <button className="btn-sm" style={{ background: 'var(--blue)', color: 'var(--blueD)' }} onClick={addPORow}>+ Add PO</button>
            </div>
            {!(modal.pos || []).length && <div style={{ fontSize: 12, color: '#A0AEC0' }}>No POs yet. Click + Add PO to log one.</div>}
            {(modal.pos || []).map((po, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input className="inp" placeholder="PO Number" value={po.number} onChange={e => updatePO(i, 'number', e.target.value)} style={{ fontSize: 12 }} />
                <input className="inp" type="date" value={po.date} onChange={e => updatePO(i, 'date', e.target.value)} style={{ fontSize: 12 }} />
                <input className="inp" type="number" placeholder="Value in Lakhs" value={po.value} onChange={e => updatePO(i, 'value', e.target.value)} style={{ fontSize: 12 }} />
                <input className="inp" placeholder="Notes" value={po.notes} onChange={e => updatePO(i, 'notes', e.target.value)} style={{ fontSize: 12 }} />
                <button className="btn-ghost" style={{ color: 'var(--roseD)' }} onClick={() => removePO(i)}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={saveBuyer}>Save</button>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {modal?._type === 'stakeholder' && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">{modal.id ? 'Edit Stakeholder' : 'Add Scope Stakeholder'}</div>
          <div className="field-wrap">
            <div className="field-label">Contact</div>
            <select className="inp" value={modal.contactId} onChange={e => setModal(m => ({ ...m, contactId: e.target.value }))}>
              <option value="">Select contact…</option>
              {contacts.sort((a,b) => a.name.localeCompare(b.name)).map(c => {
                const co = companies.find(x => x.id === c.companyId)
                return <option key={c.id} value={c.id}>{c.name}{co ? ` — ${co.name}` : ''}</option>
              })}
            </select>
          </div>
          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Role in this Scope</div>
              <select className="inp" value={modal.role} onChange={e => setModal(m => ({ ...m, role: e.target.value }))}>
                <option value="">Select…</option>
                {['Decision Maker','Approver','Technical Influencer','Procurement','Consultant','Other'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">Influence Level</div>
              <select className="inp" value={modal.influence} onChange={e => setModal(m => ({ ...m, influence: e.target.value }))}>
                <option value="">Select…</option>
                {['High','Medium','Low'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="field-wrap">
            <div className="field-label">Notes</div>
            <textarea className="inp" rows={2} value={modal.notes} onChange={e => setModal(m => ({ ...m, notes: e.target.value }))} placeholder="Any specific notes about this stakeholder's involvement…" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={saveStakeholder}>Save</button>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {modal?._type === 'activity' && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">Log Activity</div>
          <div className="field-row">
            <div className="field-wrap"><div className="field-label">Type</div>
              <select className="inp" value={modal.type} onChange={e => setModal(m => ({ ...m, type: e.target.value }))}>
                {ACT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-wrap"><div className="field-label">Date</div>
              <input className="inp" type="date" value={modal.date} onChange={e => setModal(m => ({ ...m, date: e.target.value }))} />
            </div>
          </div>
          <div className="field-wrap"><div className="field-label">Contact</div>
            <select className="inp" value={modal.contactId} onChange={e => setModal(m => ({ ...m, contactId: e.target.value }))}>
              <option value="">Select…</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field-wrap"><div className="field-label">Note</div>
            <textarea className="inp" rows={3} value={modal.note} onChange={e => setModal(m => ({ ...m, note: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={saveActivity}>Save</button>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
