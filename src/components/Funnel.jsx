import { cr, projectCoatingsPotential, projectOpportunity, projectPOTotal, STAGE_COLORS, STAGE_TEXT } from '../lib/constants'

export default function Funnel({ data, visibleProjects }) {
  const { scopes, scopeBuyers } = data
  const activeP = visibleProjects.filter(p => p.status === 'Active')
  const totalPot = activeP.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
  const totalOpp = activeP.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
  const totalPO = activeP.reduce((x, p) => x + projectPOTotal(p.id, scopes, scopeBuyers), 0)
  const poBalance = totalOpp - totalPO
  const maxVal = totalPot || 1

  const steps = [
    { label: 'Coatings Potential', val: totalPot, sub: 'Total coatings market across active projects', color: 'var(--blueD)', bg: 'var(--blue)' },
    { label: 'Protecton Opportunity', val: totalOpp, sub: 'Product values across active scopes', color: 'var(--lavD)', bg: 'var(--lav)' },
    { label: 'POs Received', val: totalPO, sub: 'Actual purchase orders released by buyers', color: '#2D7A4F', bg: '#B8E6CC' },
  ].filter(s => s.val > 0 || s.label === 'Coatings Potential')

  // Group by scope stage
  const stageGroups = {}
  scopes.filter(s => activeP.some(p => p.id === s.projectId)).forEach(s => {
    const stage = s.stage || 'Project Identified'
    if (!stageGroups[stage]) stageGroups[stage] = { count: 0, opp: 0 }
    stageGroups[stage].count++
    stageGroups[stage].opp += s.coatingsPotential || 0
  })

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }} className="funnel-wrap">
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Pipeline Funnel</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>Value progression from total market to purchase orders received</div>

      {steps.map((s, i) => {
        const pct = Math.max(4, Math.round(s.val / maxVal * 100))
        const dropPct = i > 0 && steps[i-1].val ? Math.round((1 - s.val / steps[i-1].val) * 100) : 0
        return (
          <div key={s.label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ flex: 1, position: 'relative', height: 40, background: '#F0F4FA', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct + '%', background: s.bg, borderRadius: 8, transition: 'width 0.6s ease' }} />
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 800, color: s.color, zIndex: 1 }}>{cr(s.val)}</div>
              </div>
              <div style={{ minWidth: 70, fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>{i === 0 ? '100%' : dropPct > 0 ? `▼ ${dropPct}%` : '—'}</div>
            </div>
            <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 2 }}>{s.sub}</div>
            {i < steps.length - 1 && <div style={{ marginBottom: 6, color: '#CBD5E0', fontSize: 18 }}>↓</div>}
          </div>
        )
      })}

      {totalOpp > 0 && (
        <div style={{ marginTop: 24, background: poBalance > 0 ? 'var(--straw)' : '#EAF7EE', border: `1px solid ${poBalance > 0 ? 'var(--strawD)' : 'var(--sageD)'}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: poBalance > 0 ? 'var(--strawD)' : 'var(--sageD)', marginBottom: 12 }}>
            {poBalance > 0 ? '⚠ Opportunity vs PO Received Gap' : '✓ All Opportunity Fully Received'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--lavD)' }}>{cr(totalOpp)}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Protecton Opportunity</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: '#2D7A4F' }}>{cr(totalPO) || '—'}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>PO Received</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: poBalance > 0 ? 'var(--roseD)' : 'var(--sageD)' }}>{poBalance > 0 ? cr(poBalance) : 'Nil'}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Balance Pending</div></div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Opportunity by Stage</div>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Stage</th><th>Scopes</th><th>Coatings Potential</th><th>% of Total</th></tr></thead>
            <tbody>
              {Object.entries(stageGroups).filter(([stage]) => stage !== 'Order Won').map(([stage, { count, opp }]) => {
                const pctOpp = totalPot ? Math.round(opp / totalPot * 100) : 0
                return (
                  <tr key={stage}>
                    <td><span className="badge" style={{ background: STAGE_COLORS[stage] || '#eee', color: STAGE_TEXT[stage] || '#666', fontSize: 10 }}>{stage}</span></td>
                    <td style={{ fontWeight: 600 }}>{count}</td>
                    <td style={{ fontWeight: 700, color: 'var(--lavD)' }}>{cr(opp) || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="prog-wrap" style={{ width: 80 }}><div className="prog-bar" style={{ width: pctOpp + '%', background: 'var(--lavD)' }} /></div>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{pctOpp}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}