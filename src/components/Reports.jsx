import { useState } from 'react'
import { cr, projectCoatingsPotential, projectOpportunity, projectPOTotal, projectBestStage, poCaptureRate, STAGE_COLORS, STAGE_TEXT } from '../lib/constants'

export default function Reports({ data, visibleProjects, labels = {}, sectors = [] }) {
  const { scopes, scopeBuyers, team, companies } = data
  const [tab, setTab] = useState('pipeline')
  const [filterRegion, setFilterRegion] = useState('All')
  const [filterKam, setFilterKam] = useState('All')
  const [filterSector, setFilterSector] = useState('All')

  const companyName = id => companies.find(c => c.id === id)?.name || '—'
  const kamList = (team || []).filter(u => u.role === 'Admin' || u.role === 'Manager')

  const fp = visibleProjects.filter(p => {
    if (filterRegion !== 'All' && p.region !== filterRegion) return false
    if (filterKam !== 'All' && p.kamOwnerId !== filterKam) return false
    if (filterSector !== 'All' && p.sector !== filterSector) return false
    return true
  })

  const totalPot = fp.filter(p => p.status === 'Active').reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
  const totalOpp = fp.filter(p => p.status === 'Active').reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)

  const wonProjects = fp.filter(p => scopes.some(s => s.projectId === p.id && s.stage === 'Order Won'))

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Reports</div>
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[['pipeline','Pipeline Summary'],['won','Won']].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }} className="report-filters">
        <select className="inp" value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ width: 140 }}>
          <option value="All">All Regions</option>
          {['North','South','East','West'].map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="inp" value={filterKam} onChange={e => setFilterKam(e.target.value)} style={{ width: 180 }}>
          <option value="All">All Owners</option>
          {kamList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select className="inp" value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ width: 180 }}>
          <option value="All">All Sectors</option>
          {sectors.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {tab === 'pipeline' && (
        <div>
          <div className="grid3" style={{ marginBottom: 20 }}>
            <div style={{ background: 'var(--straw)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--strawD)' }}>{cr(totalPot)}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--strawD)' }}>{labels.potentialLabel}</div>
            </div>
            <div style={{ background: 'var(--lav)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lavD)' }}>{cr(totalOpp)}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lavD)' }}>{labels.opportunityLabel}</div>
            </div>
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>{labels.projectLabel}</th><th>Sector</th><th>Region</th><th>Stage</th><th>Owner</th><th>Potential</th><th>Opportunity</th><th>Capture</th></tr></thead>
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
                      <td><span className="badge" style={{ background: STAGE_COLORS[bestStage] || '#eee', color: STAGE_TEXT[bestStage] || '#666', fontSize: 10 }}>{bestStage || '—'}</span></td>
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

      {tab === 'won' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>{labels.projectLabel}</th><th>Sector</th><th>Region</th><th>Owner</th><th>Potential</th><th>{labels.poLabel}</th><th>{labels.captureRateLabel}</th></tr></thead>
            <tbody>
              {!wonProjects.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No won {labels.projectLabelPlural?.toLowerCase()} yet.</td></tr>}
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
      )}
    </div>
  )
}