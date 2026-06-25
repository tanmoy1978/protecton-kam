// netlify/functions/ai-brief.js

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) }
  }

  const { project, scopes, activities, contacts, companies, team, scopeBuyers = [] } = body

  const companyName = (id) => companies.find(c => c.id === id)?.name || '—'
  const userName = (id) => team.find(u => u.id === id)?.name || '—'

  const scopeSummary = scopes.map(s => {
    const products = (s.products || []).map(p => `${p.name} (Rs.${p.valueL}L, ${p.status})`).join(', ')
    const buyers = scopeBuyers.filter(b => b.scopeId === s.id)
    const poLines = buyers.flatMap(b => (b.pos || []).map(po => `PO# ${po.number || 'N/A'} dated ${po.date || 'N/A'} for Rs.${po.value}L`))
    const poTotal = buyers.reduce((x, b) => (b.pos || []).reduce((y, po) => y + (parseFloat(po.value) || 0), 0) + x, 0)
    return `- ${s.name || s.type} | Stage: ${s.stage} | Potential: Rs.${s.coatingsPotential}L${products ? ` | Products: ${products}` : ''}${poTotal > 0 ? ` | POs Received: Rs.${poTotal}L (${poLines.join('; ')})` : ' | No POs received yet'}`
  }).join('\n')

  const activitySummary = activities.slice(0, 10).map(a => {
    const user = userName(a.userId)
    const contact = contacts.find(c => c.id === a.contactId)?.name || ''
    return `- ${a.date} | ${a.type}${contact ? ` with ${contact}` : ''} by ${user}: ${a.note}`
  }).join('\n')

  const prompt = `You are a senior BD manager at Berger Protecton, a protective coatings division of Berger Paints India.
Write a concise, professional Project Intelligence Brief for internal review.

PROJECT DATA:
Name: ${project.name}
Sector: ${project.sector || '—'}
Region: ${project.region || '—'}
Status: ${project.status || 'Active'}
Path Type: ${project.pathType || '—'}
Project Owner: ${companyName(project.ownerId)}
EPC: ${companyName(project.epcId)}
KAM Owner: ${userName(project.kamOwnerId)}
Expected Order Date: ${project.expectedOrderDate || 'Not set'}
Notes: ${project.notes || 'None'}

SCOPES (${scopes.length} total):
${scopeSummary || 'No scopes added yet'}

RECENT ACTIVITIES (last 10):
${activitySummary || 'No activities logged'}

Write the brief in this exact structure:

## Project Overview
2-3 sentences summarizing what this project is and its strategic importance to Berger Protecton.

## Commercial Summary
Bullet points covering: Coatings Potential, Protecton Opportunity, current stage, expected order timeline.

## Scope Breakdown
Brief description of each scope and where we stand.

## Relationship & Engagement Status
Summary of recent BD activities, key contacts engaged, relationship health.

## Key Risks & Opportunities
2-3 bullet points each.

## Recommended Next Actions
3 specific, actionable next steps for the KAM team.

Keep the tone professional but concise. This is for internal BD review, not a client document.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return { statusCode: response.status, body: JSON.stringify({ error: err?.error?.message || 'Anthropic API error' }) }
    }

    const data = await response.json()
    const brief = data.content?.[0]?.text || ''

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief })
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Server error' }) }
  }
}
