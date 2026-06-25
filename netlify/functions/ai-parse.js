// netlify/functions/ai-parse.js
const ACT_TYPES = ['Call','Site Visit','Meeting','Email','Proposal Sent','Spec Submission','Approval Received','Follow-up','Order Received','Execution Handover','Other']

exports.handler = async (event) => {
  // Only allow POST
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

  const { freeText, projects = [], contacts = [] } = body
  if (!freeText) {
    return { statusCode: 400, body: JSON.stringify({ error: 'freeText is required' }) }
  }

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
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: err?.error?.message || 'Anthropic API error' })
      }
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Server error' })
    }
  }
}
