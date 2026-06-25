import { useState } from 'react'
import Modal from './Modal'

const AI_BRIEF_ENDPOINT = '/.netlify/functions/ai-brief'

export default function ProjectBriefModal({ project, scopes, scopeBuyers, activities, contacts, companies, team, onClose }) {
  const [step, setStep] = useState('idle') // idle | generating | done | error
  const [brief, setBrief] = useState('')
  const [error, setError] = useState('')

  const generate = async () => {
    setStep('generating')
    setError('')
    try {
      // Trim payload to essentials only — prevents mobile timeout/freeze
      const payload = {
        project: {
          id: project.id,
          name: project.name,
          sector: project.sector || '',
          region: project.region || '',
          status: project.status || 'Active',
          pathType: project.pathType || '',
          ownerId: project.ownerId || '',
          epcId: project.epcId || '',
          kamOwnerId: project.kamOwnerId || '',
          expectedOrderDate: project.expectedOrderDate || '',
          notes: project.notes || '',
        },
        scopes: scopes.map(s => ({
          id: s.id,
          name: s.name || s.type || '',
          type: s.type || '',
          stage: s.stage || '',
          coatingsPotential: s.coatingsPotential || 0,
          products: (s.products || []).map(p => ({ name: p.name, valueL: p.valueL, status: p.status })),
        })),
        scopeBuyers: (scopeBuyers || []).map(b => ({
          scopeId: b.scopeId,
          pos: (b.pos || []).map(po => ({ number: po.number, date: po.date, value: po.value })),
        })),
        activities: activities.slice(0, 8).map(a => ({
          userId: a.userId,
          contactId: a.contactId || '',
          type: a.type,
          date: a.date,
          note: (a.note || '').slice(0, 200),
        })),
        contacts: contacts.map(c => ({ id: c.id, name: c.name, designation: c.designation || '', companyId: c.companyId })),
        companies: companies.map(c => ({ id: c.id, name: c.name, type: c.type })),
        team: team.map(u => ({ id: u.id, name: u.name, role: u.role })),
      }

      const response = await fetch(AI_BRIEF_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || `Server error ${response.status}`)
      }
      const data = await response.json()
      setBrief(data.brief || '')
      setStep('done')
    } catch (err) {
      setError('Failed: ' + err.message)
      setStep('error')
    }
  }

  // Download as plain text file
  const downloadTxt = () => {
    const blob = new Blob([brief], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_Brief.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(brief)
      .then(() => alert('Brief copied to clipboard!'))
      .catch(() => alert('Please select and copy manually.'))
  }

  // Render markdown-like text to simple HTML
  const renderBrief = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <div key={i} style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 20, marginBottom: 6, borderBottom: '2px solid var(--border)', paddingBottom: 4 }}>{line.replace('## ', '')}</div>
      if (line.startsWith('- ')) return <div key={i} style={{ fontSize: 13, color: 'var(--text)', padding: '3px 0 3px 16px', position: 'relative' }}><span style={{ position: 'absolute', left: 4 }}>•</span>{line.replace('- ', '')}</div>
      if (line.trim() === '') return <div key={i} style={{ height: 6 }} />
      return <div key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, padding: '2px 0' }}>{line}</div>
    })
  }

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4A8C6A, #4A7BBF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Project Brief</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{project.name}</div>
        </div>
        {step === 'done' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 10px' }} onClick={copyToClipboard}>📋 Copy</button>
            <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 10px' }} onClick={downloadTxt}>⬇ Download</button>
          </div>
        )}
      </div>

      {/* IDLE */}
      {step === 'idle' && (
        <div>
          <div style={{ background: '#F8F9FF', border: '1px solid #E8ECF8', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 13, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>This brief will include:</div>
            <div style={{ color: 'var(--muted)' }}>
              ✦ Project overview & strategic importance<br />
              ✦ Commercial summary (potential, opportunity, stage)<br />
              ✦ Scope breakdown<br />
              ✦ Engagement & relationship status<br />
              ✦ Key risks & opportunities<br />
              ✦ Recommended next actions
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Based on {scopes.length} scope{scopes.length !== 1 ? 's' : ''} and {activities.length} activity log{activities.length !== 1 ? 's' : ''}.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={generate}
              style={{ background: 'linear-gradient(135deg, #4A8C6A, #4A7BBF)', border: 'none', minWidth: 160 }}
            >
              ✨ Generate Brief
            </button>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}

      {/* GENERATING */}
      {step === 'generating' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #4A7BBF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>Generating Brief…</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>AI is analysing project data. This takes 5–10 seconds.</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* ERROR */}
      {step === 'error' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--roseD)' }}>Generation Failed</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, marginBottom: 20 }}>{error}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={generate}>Try Again</button>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>
      )}

      {/* DONE — show brief */}
      {step === 'done' && (
        <div>
          <div style={{
            background: '#FAFBFF',
            border: '1px solid #E8ECF8',
            borderRadius: 10,
            padding: '16px 20px',
            maxHeight: '55vh',
            overflowY: 'auto',
            marginBottom: 16,
          }}>
            {renderBrief(brief)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={generate} style={{ background: 'linear-gradient(135deg, #4A8C6A, #4A7BBF)', border: 'none' }}>↺ Regenerate</button>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
