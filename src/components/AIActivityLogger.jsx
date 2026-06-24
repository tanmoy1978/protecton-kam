import { useState } from 'react'
import { uid, ACT_TYPES, fmt, initials, avatarColor } from '../lib/constants'
import Modal from './Modal'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

// ── AI PARSER ─────────────────────────────────────────────────
async function parseActivityWithAI(freeText, projects, contacts, products) {
  const today = new Date().toISOString().slice(0, 10)
  const projectList = projects.map(p => `${p.id}|||${p.name}`).join('\n')
  const contactList = contacts.map(c => `${c.id}|||${c.name}|||${c.designation || ''}`).join('\n')

  const prompt = `You are a BD assistant for Berger Protecton, a protective coatings company. 
Extract structured activity data from this free-form note written by a sales person.

TODAY'S DATE: ${today}

AVAILABLE PROJECTS (id|||name):
${projectList || 'None'}

AVAILABLE CONTACTS (id|||name|||designation):
${contactList || 'None'}

ACTIVITY TYPES: ${ACT_TYPES.join(', ')}

FREE-FORM NOTE:
"${freeText}"

Return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "projectId": "<best matching project id from the list, or empty string>",
  "contactId": "<best matching contact id from the list, or empty string>",
  "type": "<best matching activity type from the list>",
  "date": "<date in YYYY-MM-DD format, default to today if not mentioned>",
  "note": "<cleaned professional summary of what happened>",
  "nextAction": "<suggested next step based on the note, 1 sentence>",
  "productsDetected": "<any Berger Protecton products mentioned, comma separated, or empty>",
  "confidence": "<high|medium|low>"
}`

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

// ── FLOATING AI BUTTON ────────────────────────────────────────
export function AIFloatingButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 80,
        right: 20,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7A5BAF, #4A7BBF)',
        color: '#fff',
        border: 'none',
        fontSize: 22,
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(122,91,175,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'transform 0.15s',
      }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      title="AI Activity Logger"
    >
      ✨
    </button>
  )
}

// ── MAIN AI ACTIVITY LOGGER MODAL ─────────────────────────────
export default function AIActivityLogger({ data, currentUser, ops, visibleProjects, onClose }) {
  const { contacts } = data
  const [step, setStep] = useState('input') // input | parsing | review | saving | done
  const [freeText, setFreeText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const handleParse = async () => {
    if (!freeText.trim()) return setError('Please describe what happened.')
    setError('')
    setStep('parsing')
    try {
      const result = await parseActivityWithAI(freeText, visibleProjects, contacts)
      if (!result) throw new Error('Could not parse response')
      setModal({
        projectId: result.projectId || '',
        contactId: result.contactId || '',
        type: result.type || 'Call',
        date: result.date || new Date().toISOString().slice(0, 10),
        note: result.note || freeText,
        rcIds: [],
        userId: currentUser.id,
        _nextAction: result.nextAction || '',
        _productsDetected: result.productsDetected || '',
        _confidence: result.confidence || 'medium',
      })
      setParsed(result)
      setStep('review')
    } catch (err) {
      setError('AI parsing failed. Please try again.')
      setStep('input')
    }
  }

  const handleSave = async () => {
    if (!modal.projectId) return setError('Please select a project.')
    if (!modal.note.trim()) return setError('Note is required.')
    setStep('saving')
    const { _nextAction, _productsDetected, _confidence, ...activityData } = modal
    // Append next action to note if present
    const finalNote = _nextAction
      ? `${activityData.note}\n\n→ Next: ${_nextAction}`
      : activityData.note
    await ops.saveActivity({ ...activityData, note: finalNote, id: uid() })
    setStep('done')
    setTimeout(() => onClose(), 1200)
  }

  const confidenceColor = { high: '#2D7A4F', medium: '#B89030', low: '#B04A6A' }

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7A5BAF, #4A7BBF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✨</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>AI Activity Logger</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Describe what happened — AI will fill in the details</div>
        </div>
      </div>

      {/* STEP 1: INPUT */}
      {(step === 'input' || step === 'parsing') && (
        <div>
          <div className="field-wrap">
            <div className="field-label">What happened? (speak freely)</div>
            <textarea
              className="inp"
              rows={5}
              placeholder={`e.g. "Met Rajesh Nair at L&T ECC Powai today, discussed Berchar WB70 for the turbine hall scope. He's keen but wants a demo next month. Sent him the TDS by email."`}
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              disabled={step === 'parsing'}
              style={{ fontSize: 13, lineHeight: 1.6 }}
            />
          </div>
          {error && <div style={{ color: 'var(--roseD)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleParse}
              disabled={step === 'parsing'}
              style={{ background: 'linear-gradient(135deg, #7A5BAF, #4A7BBF)', border: 'none', minWidth: 120 }}
            >
              {step === 'parsing' ? '✨ Parsing…' : '✨ Parse with AI'}
            </button>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          </div>
          {step === 'parsing' && (
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, border: '2px solid #7A5BAF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              AI is reading your note…
            </div>
          )}
        </div>
      )}

      {/* STEP 2: REVIEW */}
      {step === 'review' && modal && (
        <div>
          {/* Confidence badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: '#F8F9FF', borderRadius: 8, border: '1px solid #E8ECF8' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>AI Confidence:</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor[parsed?._confidence || modal._confidence] }}>
              {(parsed?._confidence || modal._confidence || 'medium').toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>Review and edit before saving</span>
          </div>

          {/* Detected products */}
          {modal._productsDetected && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#EEF8F2', borderRadius: 8, border: '1px solid #C8DDD1' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2D7A4F' }}>Products detected: </span>
              <span style={{ fontSize: 11, color: '#2D7A4F' }}>{modal._productsDetected}</span>
            </div>
          )}

          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Project</div>
              <select className="inp" value={modal.projectId} onChange={e => setModal(m => ({ ...m, projectId: e.target.value }))}>
                <option value="">Select…</option>
                {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field-wrap">
              <div className="field-label">Activity Type</div>
              <select className="inp" value={modal.type} onChange={e => setModal(m => ({ ...m, type: e.target.value }))}>
                {ACT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field-wrap">
              <div className="field-label">Date</div>
              <input className="inp" type="date" value={modal.date} onChange={e => setModal(m => ({ ...m, date: e.target.value }))} />
            </div>
            <div className="field-wrap">
              <div className="field-label">Contact</div>
              <select className="inp" value={modal.contactId} onChange={e => setModal(m => ({ ...m, contactId: e.target.value }))}>
                <option value="">Select…</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.designation ? ` — ${c.designation}` : ''}</option>)}
              </select>
            </div>
          </div>

          <div className="field-wrap">
            <div className="field-label">Note (AI cleaned)</div>
            <textarea className="inp" rows={3} value={modal.note} onChange={e => setModal(m => ({ ...m, note: e.target.value }))} />
          </div>

          {modal._nextAction && (
            <div className="field-wrap">
              <div className="field-label">Suggested Next Action</div>
              <div style={{ padding: '10px 12px', background: '#FFF8EC', borderRadius: 8, border: '1px solid #F5EAC8', fontSize: 13, color: '#B89030', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span>→</span>
                <input
                  className="inp"
                  value={modal._nextAction}
                  onChange={e => setModal(m => ({ ...m, _nextAction: e.target.value }))}
                  style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 13, color: '#B89030', fontWeight: 600 }}
                />
              </div>
            </div>
          )}

          {error && <div style={{ color: 'var(--roseD)', fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              style={{ background: 'linear-gradient(135deg, #7A5BAF, #4A7BBF)', border: 'none' }}
            >
              Save Activity
            </button>
            <button className="btn btn-outline" onClick={() => setStep('input')}>← Re-enter</button>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}

      {/* STEP 3: DONE */}
      {(step === 'saving' || step === 'done') && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{step === 'done' ? '✅' : '⏳'}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{step === 'done' ? 'Activity Saved!' : 'Saving…'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {step === 'done' ? 'Your activity has been logged successfully.' : 'Please wait…'}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Modal>
  )
}
