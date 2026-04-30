import { cr, projectCoatingsPotential, projectOpportunity, projectWonValue, projectPOTotal, captureRate, initials, avatarColor, STAGE_COLORS, STAGE_TEXT } from '../lib/constants'

export default function Pipeline({ data, visibleProjects }) {
  const { scopes, scopeBuyers, team } = data
  const activeP = visibleProjects.filter(p => p.status === 'Active')
  const totalPot = activeP.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
  const wonProjects = activeP.filter(p => p.stage === 'Order Won')
  const oppProjects = activeP.filter(p => !['Order Won','Order Lost','Cancelled'].includes(p.stage))
  const totalWon = wonProjects.reduce((x, p) => x + projectWonValue(p.id, scopes), 0)
  const totalProt = oppProjects.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
  const cr_ = captureRate(totalProt, totalWon)
  const kamList = team.filter(u => u.role === 'National KAM' || u.role === 'Regional KAM')

  return (
    <div>
      <div className="grid4" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ background: 'var(--straw)' }}>
          <div className="stat-val" style={{ color: 'var(--strawD)' }}>{cr(totalPot) || '—'}</div>
          <div className="stat-label" style={{ color: 'var(--strawD)' }}>Coatings Potential</div>
          <div className="stat-sub" style={{ color: 'var(--strawD)' }}>Total market across active projects</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--lav)' }}>
          <div className="stat-val" style={{ color: 'var(--lavD)' }}>{totalProt ? cr(totalProt) : '—'}</div>
          <div className="stat-label" style={{ color: 'var(--lavD)' }}>Protecton Opportunity</div>
          <div className="stat-sub" style={{ color: 'var(--lavD)' }}>Addressable by Protecton products</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--sage)' }}>
          <div className="stat-val" style={{ color: 'var(--sageD)' }}>{totalWon ? cr(totalWon) : '—'}</div>
          <div className="stat-label" style={{ color: 'var(--sageD)' }}>Orders Won</div>
          <div className="stat-sub" style={{ color: 'var(--sageD)' }}>Protecton product values confirmed</div>
        </div>
        <div className="stat-card" style={{ background: cr_ >= 60 ? 'var(--sage)' : cr_ >= 30 ? 'var(--straw)' : 'var(--rose)' }}>
          <div className="stat-val" style={{ color: cr_ >= 60 ? 'var(--sageD)' : cr_ >= 30 ? 'var(--strawD)' : 'var(--roseD)' }}>{totalWon ? cr_ + '%' : '—'}</div>
          <div className="stat-label" style={{ color: cr_ >= 60 ? 'var(--sageD)' : cr_ >= 30 ? 'var(--strawD)' : 'var(--roseD)' }}>Capture Rate</div>
          <div className="stat-sub" style={{ color: cr_ >= 60 ? 'var(--sageD)' : cr_ >= 30 ? 'var(--strawD)' : 'var(--roseD)' }}>Orders Won ÷ Protecton Opportunity</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>KAM Pipeline</div>
          {kamList.map(u => {
            const kp = activeP.filter(p => p.kamOwnerId === u.id)
            if (!kp.length) return null
            const upot = kp.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
            const uwon = kp.filter(p => p.stage === 'Order Won').reduce((x, p) => x + projectWonValue(p.id, scopes), 0)
            const uopp = kp.filter(p => !['Order Won','Order Lost','Cancelled'].includes(p.stage)).reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
            const ucr = captureRate(uopp, uwon)
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: avatarColor(u.name) }}>{initials(u.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{u.name} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>· {u.region}</span></div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{kp.length} projects · Pot: {cr(upot)} · Opp: {cr(uopp)} · Won: {cr(uwon) || '—'}</div>
                  <div className="prog-wrap" style={{ marginTop: 4 }}>
                    <div className="prog-bar" style={{ width: upot ? Math.round(uwon / upot * 100) + '%' : '0%', background: 'var(--blueD)' }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lavD)' }}>{uwon ? ucr + '%' : '—'}</div>
              </div>
            )
          })}
        </div>

        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Stage Distribution</div>
          {['Project Identified','Spec Influence','Approved on Spec','Enquiry Received','Proposal Submitted','Negotiation'].map(stage => {
            const sp = activeP.filter(p => p.stage === stage)
            if (!sp.length) return null
            const val = sp.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
            return (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span className="badge" style={{ background: STAGE_COLORS[stage], color: STAGE_TEXT[stage], fontSize: 10, minWidth: 140 }}>{stage}</span>
                <div style={{ flex: 1 }}>
                  <div className="prog-wrap">
                    <div className="prog-bar" style={{ width: totalProt ? Math.round(val / totalProt * 100) + '%' : '0%', background: STAGE_TEXT[stage] }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', minWidth: 60, textAlign: 'right' }}>{sp.length} · {cr(val)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
