export const STAGES = ['Project Identified','Spec Influence','Approved on Spec','Enquiry Received','Proposal Submitted','Negotiation','Order Won','Order Lost','On Hold','Cancelled']
export const SPEC_STATUS = ['Not Specified','Spec Influence Ongoing','Approved on Spec','Approved Equivalent']
export const PATH_TYPES = ['Proactive','Reactive']
export const COMPANY_TYPES = ['Project Owner','EPC Contractor','Fabricator','Consultant','Subcontractor']
export const CONTACT_ROLES = ['Decision Maker','Approver','Technical Influencer','Procurement','Consultant','Other']
export const INFLUENCE = ['High','Medium','Low']
export const ACT_TYPES = ['Call','Site Visit','Meeting','Email','Proposal Sent','Spec Submission','Approval Received','Follow-up','Order Received','Execution Handover','Other']
export const SECTORS = ['Oil & Gas','Power','Fertilizer','Steel','Water & Wastewater','Data Centers','Infrastructure','Petrochemical','Refinery','Other']
export const PROJ_STATUS = ['Active','On Hold','Cancelled','Completed']
export const SCOPE_TYPES = ['Tank Lining','Structural Steel','Fireproofing','Pipeline','Civil & Concrete','Equipment','Jetty & Marine','Storage Vessel','Other']
export const DATA_SOURCES = ['Internal Estimate','Enquiry Document','Tender Document','Client Confirmed','Assumed']
export const PROD_STATUS = ['Specified','Proposed','Under Discussion','Approved Equivalent','Lost']
export const QTY_UNITS = ['m2','MT Steel','No. of Tanks','No. of Vessels','No. of Columns','Running Metres','m3','Other']
export const REGIONS = ['West','South','North','East','All']
export const DEFAULT_TEAM = [
  { id: 'u1', name: 'Tanmoy Sen', role: 'National KAM', region: 'All', pin: '1234', active: true },
  { id: 'u2', name: 'Ashok Vasani', role: 'Regional KAM', region: 'West', pin: '1234', active: true },
  { id: 'u3', name: 'Vinoth Kumar', role: 'Regional KAM', region: 'South', pin: '1234', active: true },
  { id: 'u4', name: 'Hemanga Makhal', role: 'KAE', region: 'All', pin: '1234', active: true },
  { id: 'u5', name: 'Priyadarshini', role: 'KAE', region: 'All', pin: '1234', active: true },
]

export const STAGE_COLORS = {
  'Project Identified': '#C7D9F0',
  'Spec Influence': '#DDD0F0',
  'Approved on Spec': '#C8DDD1',
  'Enquiry Received': '#F5EAC8',
  'Proposal Submitted': '#F5D9CC',
  'Negotiation': '#F0C8D4',
  'Order Won': '#C8DDD1',
  'Order Lost': '#F0C8D4',
  'On Hold': '#D0D8E4',
  'Cancelled': '#E8E8E8',
}
export const STAGE_TEXT = {
  'Project Identified': '#4A7BBF',
  'Spec Influence': '#7A5BAF',
  'Approved on Spec': '#4A8C6A',
  'Enquiry Received': '#B89030',
  'Proposal Submitted': '#C46A45',
  'Negotiation': '#B04A6A',
  'Order Won': '#2D7A4F',
  'Order Lost': '#B04A6A',
  'On Hold': '#4A5A6A',
  'Cancelled': '#888',
}

export const uid = () => 'i' + Math.random().toString(36).slice(2, 9)

export const fmt = d => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const cr = v => {
  if (!v && v !== 0) return '—'
  if (v >= 100) { const c = v / 100; return 'Rs.' + (c % 1 === 0 ? c : parseFloat(c.toFixed(2))) + 'Cr' }
  if (v >= 1) return 'Rs.' + (v % 1 === 0 ? v : parseFloat(v.toFixed(2))) + 'L'
  return 'Rs.' + (v * 100).toFixed(0) + 'K'
}

export const initials = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'

const AVATAR_COLORS = ['#4A7BBF','#4A8C6A','#C46A45','#7A5BAF','#B04A6A','#B89030','#4A5A6A']
export const avatarColor = n => { let h = 0; for (let c of (n || '')) h = c.charCodeAt(0) + ((h << 5) - h); return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] }

export const scopeOpportunity = (s) => {
  if (s.protectonOpportunity && s.protectonOpportunity > 0) return s.protectonOpportunity
  return (s.products || []).reduce((x, p) => x + (p.valueL || 0), 0)
}
export const scopeProtecton = (s) => (s.products || []).reduce((x, p) => x + (p.valueL || 0), 0)
export const scopePOTotal = (sid, scopeBuyers) => scopeBuyers.filter(b => b.scopeId === sid).reduce((x, b) => (b.pos || []).reduce((y, p) => y + (p.value || 0), 0) + x, 0)
export const projectCoatingsPotential = (pid, scopes) => scopes.filter(s => s.projectId === pid).reduce((x, s) => x + (s.coatingsPotential || 0), 0)
export const projectOpportunity = (pid, scopes) => scopes.filter(s => s.projectId === pid).reduce((x, s) => x + scopeOpportunity(s), 0)
export const projectWonValue = (pid, scopes) => scopes.filter(s => s.projectId === pid).reduce((x, s) => x + scopeProtecton(s), 0)
export const projectPOTotal = (pid, scopes, scopeBuyers) => scopes.filter(s => s.projectId === pid).reduce((x, s) => x + scopePOTotal(s.id, scopeBuyers), 0)
export const captureRate = (opp, won) => { if (!opp) return 0; return Math.min(100, Math.round(won / opp * 100)) }
