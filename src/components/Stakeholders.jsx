import { useState } from 'react'
import { cr, initials, avatarColor, scopeOpportunity, scopePOTotal } from '../lib/constants'

export default function Stakeholders({ data, visibleProjects, onOpenProject }) {
  const { contacts, companies, scopes, scopeBuyers, scopeStakeholders, projects } = data
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [filterInfluence, setFilterInfluence] = useState('All')

  // Build stakeholder summary - for each contact linked to any scope stakeholder
  const stakeholderMap = {}

  scopeStakeholders.forEach(sk => {
    const scope = scopes.find(s => s.id === sk.scopeId)
    if (!scope) return
    const project = projects.find(p => p.id === scope.projectId)
    if (!project) return
    // Only include visible projects
    if (!visibleProjects.some(p => p.id === project.id)) return

    const cid = sk.contactId
    if (!stakeholderMap[cid]) {
      stakeholderMap[cid] = {
        contactId: cid,
        roles: new Set(),
        influences: new Set(),
        projectIds: new Set(),
        totalPot: 0,
        totalOpp: 0,
        totalPO: 0,
      }
    }
    const entry = stakeholderMap[cid]
    if (sk.role) entry.roles.add(sk.role)
    if (sk.influence) entry.influences.add(sk.influence)
    entry.projectIds.add(project.id)
    entry.totalPot += scope.coatingsPotential || 0
    entry.totalOpp += scopeOpportunity(scope)
    entry.totalPO += scopePOTotal(scope.id, scopeBuyers)
  })

  const INFLUENCE_ORDER = { 'High': 0, 'Medium': 1, 'Low': 2 }

  let stakeholders = Object.values(stakeholderMap)
    .map(entry => {
      const contact = contacts.find(c => c.id === entry.contactId)
      const company = contact ? companies.find(c => c.id === contact.companyId) : null
      return { ...entry, contact, company,
        roles: [...entry.roles].join(', '),
        influence: [...entry.influences].sort((a,b) => (INFLUENCE_ORDER[a]??9) - (INFLUENCE_ORDER[b]??9))[0] || '',
        projectCount: entry.projectIds.size
      }
    })
    .filter(s => s.contact)
    .sort((a, b) => b.totalOpp - a.totalOpp)

  // Filters
  if (search) stakeholders = stakeholders.filter(s =>
    s.contact.name.toLowerCase().includes(search.toLowerCase()) ||
    s.company?.name?.toLowerCase().includes(search.toLowerCase())
  )
  if (filterRole !== 'All') stakeholders = stakeholders.filter(s => s.roles.includes(filterRole))
  if (filterInfluence !== 'All') stakeholders = stakeholders.filter(s => s.influence === filterInfluence)

  const allRoles = [...new Set(scopeStakeholders.map(s => s.role).filter(Boolean))]

  // Summary totals
  const totalPot = stakeholders.reduce((x, s) => x + s.totalPot, 0)
  const totalOpp = stakeholders.reduce((x, s) => x + s.totalOpp, 0)
  const totalPO = stakeholders.reduce((x, s) => x + s.totalPO, 0)

  const influenceColor = { High: 'var(--roseD)', Medium: 'var(--strawD)', Low: 'var(--muted)' }

  return (
    <div>
      {/* Summary cards */}
      <div className="grid3" style={{ marginBottom: 16 }}>
        <div className="stat-card" style={{ background: 'var(--blue)' }}>
          <div className="stat-val" style={{ color: 'var(--blueD)' }}>{stakeholders.length}</div>
          <div className="stat-label" style={{ color: 'var(--blueD)' }}>Stakeholders</div>
          <div className="stat-sub" style={{ color: 'var(--blueD)' }}>Across all projects</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--straw)' }}>
          <div className="stat-val" style={{ color: 'var(--strawD)' }}>{cr(totalPot) || '—'}</div>
          <div className="stat-label" style={{ color: 'var(--strawD)' }}>Coatings Potential</div>
          <div className="stat-sub" style={{ color: 'var(--strawD)' }}>Across linked scopes</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--lav)' }}>
          <div className="stat-val" style={{ color: 'var(--lavD)' }}>{cr(totalOpp) || '—'}</div>
          <div className="stat-label" style={{ color: 'var(--lavD)' }}>Protecton Opportunity</div>
          <div className="stat-sub" style={{ color: 'var(--lavD)' }}>Across linked scopes</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="inp" placeholder="Search stakeholders…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        <select className="inp" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ flex: 1, minWidth: 160 }}>
          <option value="All">All Roles</option>
          {allRoles.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="inp" value={filterInfluence} onChange={e => setFilterInfluence(e.target.value)} style={{ flex: 1, minWidth: 120 }}>
          <option value="All">All Influence</option>
          {['High','Medium','Low'].map(i => <option key={i}>{i}</option>)}
        </select>
      </div>

      {/* Stakeholder list */}
      {!stakeholders.length && (
        <div className="empty">
          <div className="empty-icon">👥</div>
          <div>No stakeholders found. Add stakeholders to scopes within projects.</div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {stakeholders.map((s, i) => (
          <div key={s.contactId} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            borderBottom: i < stakeholders.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            {/* Avatar */}
            <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, background: avatarColor(s.contact.name), flexShrink: 0 }}>
              {initials(s.contact.name)}
            </div>

            {/* Name + company + role */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.contact.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {s.company?.name && <span>{s.company.name}</span>}
                {s.contact.designation && <span> · {s.contact.designation}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {s.roles && <span className="tag" style={{ background: 'var(--peach)', color: 'var(--peachD)', fontSize: 10 }}>{s.roles}</span>}
                {s.influence && <span style={{ fontSize: 11, fontWeight: 700, color: influenceColor[s.influence] || 'var(--muted)' }}>● {s.influence}</span>}
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{s.projectCount} project{s.projectCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', gap: 16, textAlign: 'right', flexShrink: 0 }}>
              {s.totalPot > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--strawD)' }}>{cr(s.totalPot)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>Potential</div>
                </div>
              )}
              {s.totalOpp > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lavD)' }}>{cr(s.totalOpp)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>Opportunity</div>
                </div>
              )}
              {s.totalPO > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2D7A4F' }}>{cr(s.totalPO)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>POs</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}