import { useState } from 'react'
import { cr, projectCoatingsPotential, projectOpportunity, projectPOTotal, projectBestStage, projectWonValue, poCaptureRate, STAGE_COLORS, STAGE_TEXT } from '../lib/constants'

export default function Reports({ data, visibleProjects }) {
  const { scopes, scopeBuyers, team, companies } = data
  const [tab, setTab] = useState('pipeline')
  const [filterRegion, setFilterRegion] = useState('All')
  const [filterKam, setFilterKam] = useState('All')
  const [filterSector, setFilterSector] = useState('All')

  const companyName = id => companies.find(c => c.id === id)?.name || '—'
  const kamList = team.filter(u => u.role === 'National KAM' || u.role === 'Regional KAM')

  const fp = visibleProjects.filter(p => {
    if (filterRegion !== 'All' && p.region !== filterRegion) return false
    if (filterKam !== 'All' && p.kamOwnerId !== filterKam) return false
    if (filterSector !== 'All' && p.sector !== filterSector) return false
    return true
  })

  const totalPot = fp.filter(p => p.status === 'Active').reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
  const totalOpp = fp.filter(p => p.status === 'Active').reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)

  // Projects with at least one Order Won scope
  const wonProjects = fp.filter(p => scopes.some(s => s.projectId === p.id && s.stage === 'Order Won'))
  const lostProjects = fp.filter(p => scopes.every(s => s.projectId !== p.id || ['Order Lost','Cancelled'].includes(s.stage)) && scopes.some(s => s.projectId === p.id))

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Reports</div>
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[['pipeline','Pipeline Summary'],['wonlost','Won / Lost'],['spec','Spec Coverage']].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }} className='report-filters'>
        <select className="inp" value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ width: 140 }}>
          <option value="All">All Regions</option>
          {['West','South','North','East'].map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="inp" value={filterKam} onChange={e => setFilterKam(e.target.value)} style={{ width: 180 }}>
          <option value="All">All KAMs</option>
          {kamList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select className="inp" value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ width: 180 }}>
          <option value="All">All Sectors</option>
          {['Oil & Gas','Power','Fertilizer','Steel','Water & Wastewater','Infrastructure','Petrochemical','Other'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {tab === 'pipeline' && (
        <div>
          <div className="grid3" style={{ marginBottom: 20 }}>
            <div style={{ background: 'var(--straw)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--strawD)' }}>{cr(totalPot)}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--strawD)' }}>Coatings Potential</div>
            </div>
            <div style={{ background: 'var(--lav)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lavD)' }}>{cr(totalOpp)}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lavD)' }}>Protecton Opportunity</div>
            </div>
            <div style={{ background: 'var(--rose)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--roseD)' }}>{fp.filter(p => p.status === 'Active' && scopes.filter(s => s.projectId === p.id).some(s => !s.specStatus || s.specStatus === '' || s.specStatus === 'Not Specified')).length}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--roseD)' }}>Spec Risk</div>
            </div>
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Project</th><th>Sector</th><th>Region</th><th>EPC</th><th>Stage</th><th>Spec</th><th>KAM</th><th>Potential</th><th>Protecton</th><th>Capture</th></tr></thead>
              <tbody>
                {fp.map(p => {
                  const pot = projectCoatingsPotential(p.id, scopes)
                  const opp = projectOpportunity(p.id, scopes)
                  const ppo = projectPOTotal(p.id, scopes, scopeBuyers)
                  const cr_ = poCaptureRate(opp, ppo)
                  const bestStage = projectBestStage(p.id, scopes)
                  const owner = team.find(u => u.id === p.kamOwnerId)
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontSize: 11 }}>{p.sector || '—'}</td>
                      <td style={{ fontSize: 11 }}>{p.region || '—'}</td>
                      <td style={{ fontSize: 11 }}>{companyName(p.epcId)}</td>
                      <td><span className="badge" style={{ background: STAGE_COLORS[bestStage] || '#eee', color: STAGE_TEXT[bestStage] || '#666', fontSize: 10 }}>{bestStage || '—'}</span></td>
                      <td style={{ fontSize: 11 }}>{p.specStatus || '—'}</td>
                      <td style={{ fontSize: 11 }}>{owner?.name || '—'}</td>
                      <td style={{ fontWeight: 700 }}>{cr(pot)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--lavD)' }}>{cr(opp) || '—'}</td>
                      <td style={{ fontWeight: 700, color: cr_ >= 60 ? 'var(--sageD)' : cr_ >= 30 ? 'var(--strawD)' : cr_ > 0 ? 'var(--roseD)' : '#B0BEC5' }}>{ppo > 0 ? cr_ + '%' : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'wonlost' && (
        <div>
          <div className="grid4" style={{ marginBottom: 20 }}>
            <div style={{ background: 'var(--sage)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--sageD)' }}>{cr(wonProjects.reduce((x,p) => x + projectPOTotal(p.id, scopes, scopeBuyers), 0)) || '—'}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sageD)' }}>POs Received — Won Projects ({wonProjects.length})</div>
            </div>
            <div style={{ background: 'var(--rose)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--roseD)' }}>{cr(lostProjects.reduce((x,p) => x + projectOpportunity(p.id, scopes), 0)) || '—'}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--roseD)' }}>Lost ({lostProjects.length} projects)</div>
            </div>
          </div>
          {wonProjects.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sageD)', marginBottom: 10 }}>Orders Won</div>
              <div className="card" style={{ overflowX: 'auto' }}>
                <table className="tbl">
                  <thead><tr><th>Project</th><th>Sector</th><th>Region</th><th>KAM</th><th>Potential</th><th>POs Received</th><th>Capture Rate</th></tr></thead>
                  <tbody>
                    {wonProjects.map(p => {
                      const pot = projectCoatingsPotential(p.id, scopes)
                      const opp = projectOpportunity(p.id, scopes)
                      const ppo = projectPOTotal(p.id, scopes, scopeBuyers)
                      const cr_ = poCaptureRate(opp, ppo)
                      const owner = team.find(u => u.id === p.kamOwnerId)
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td style={{ fontSize: 11 }}>{p.sector || '—'}</td>
                          <td style={{ fontSize: 11 }}>{p.region || '—'}</td>
                          <td style={{ fontSize: 11 }}>{owner?.name || '—'}</td>
                          <td style={{ fontWeight: 700 }}>{cr(pot)}</td>
                          <td style={{ fontWeight: 700, color: '#2D7A4F' }}>{cr(ppo) || '—'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--sageD)' }}>{ppo > 0 ? cr_ + '%' : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'spec' && (
        <div>
          <div className="grid4" style={{ marginBottom: 20 }}>
            {['Approved on Spec','Spec Influence Ongoing','Not Specified','Approved Equivalent'].map(s => {
              const count = fp.filter(p => (p.specStatus || 'Not Specified') === s && p.status === 'Active').length
              const bg = s === 'Approved on Spec' ? 'var(--sage)' : s === 'Spec Influence Ongoing' ? 'var(--straw)' : s === 'Not Specified' ? 'var(--rose)' : 'var(--lav)'
              const col = s === 'Approved on Spec' ? 'var(--sageD)' : s === 'Spec Influence Ongoing' ? 'var(--strawD)' : s === 'Not Specified' ? 'var(--roseD)' : 'var(--lavD)'
              return <div key={s} style={{ background: bg, borderRadius: 12, padding: '14px 16px' }}><div style={{ fontSize: 28, fontWeight: 800, color: col }}>{count}</div><div style={{ fontSize: 11, fontWeight: 700, color: col }}>{s}</div></div>
            })}
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Project</th><th>Stage</th><th>Spec Status</th><th>KAM</th><th>Potential</th><th>Opportunity</th></tr></thead>
              <tbody>
                {fp.filter(p => p.status === 'Active').map(p => {
                  const owner = team.find(u => u.id === p.kamOwnerId)
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{(() => { const s = projectBestStage(p.id, scopes); return s ? <span className="badge" style={{ background: STAGE_COLORS[s] || '#eee', color: STAGE_TEXT[s] || '#666', fontSize: 10 }}>{s}</span> : '—' })()}</td>
                      <td style={{ fontSize: 11 }}>{p.specStatus || 'Not Specified'}</td>
                      <td style={{ fontSize: 11 }}>{owner?.name || '—'}</td>
                      <td style={{ fontWeight: 700 }}>{cr(projectCoatingsPotential(p.id, scopes))}</td>
                      <td style={{ fontWeight: 700, color: 'var(--lavD)' }}>{cr(projectOpportunity(p.id, scopes))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}