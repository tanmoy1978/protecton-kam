import { supabase } from './supabase'

// ── MAPPERS: DB (snake_case) <-> App (camelCase) ──────────────

export const fromDb = {
  team: r => ({ id: r.id, name: r.name, role: r.role, region: r.region, pin: r.pin || '1234', active: r.active !== false }),
  company: r => ({ id: r.id, name: r.name, type: r.type, sector: r.sector, region: r.region, city: r.city, phone: r.phone, email: r.email, notes: r.notes }),
  contact: r => ({ id: r.id, companyId: r.company_id, name: r.name, designation: r.designation, phone: r.phone, email: r.email, role: r.role, influence: r.influence, lastContacted: r.last_contacted, notes: r.notes }),
  rc: r => ({ id: r.id, name: r.name, designation: r.designation, region: r.region, city: r.city, phone: r.phone, notes: r.notes }),
  project: r => ({ id: r.id, name: r.name, stage: r.stage, status: r.status, region: r.region, sector: r.sector, pathType: r.path_type, ownerId: r.owner_id, epcId: r.epc_id, fabricatorIds: r.fabricator_ids || [], kamOwnerId: r.kam_owner_id, supportingKaeIds: r.supporting_kae_ids || [], regionalColleagueIds: r.regional_colleague_ids || [], specStatus: r.spec_status, notes: r.notes, expectedOrderDate: r.expected_order_date }),
  scope: r => ({ id: r.id, projectId: r.project_id, name: r.name || r.type, type: r.type, dataSource: r.data_source, scopeValue: r.qty, coatingsPotential: r.coatings_potential || 0, protectonOpportunity: r.protecton_opportunity || 0, qty: r.qty, qtyUnit: r.qty_unit, notes: r.notes, products: r.products || [] }),
  activity: r => ({ id: r.id, projectId: r.project_id, contactId: r.contact_id, userId: r.user_id, type: r.type, date: r.date, note: r.note, rcIds: r.rc_ids || [] }),
  scopeBuyer: r => ({ id: r.id, scopeId: r.scope_id, companyId: r.company_id, subletById: r.sublet_by_id, pos: r.pos || [] }),
  scopeStakeholder: r => ({ id: r.id, scopeId: r.scope_id, contactId: r.contact_id, role: r.role, influence: r.influence, notes: r.notes || '' }),
}

export const toDb = {
  team: u => ({ id: u.id, name: u.name, role: u.role, region: u.region, pin: u.pin || '1234', active: u.active !== false, updated_at: new Date().toISOString() }),
  company: c => ({ id: c.id, name: c.name, type: c.type, sector: c.sector, region: c.region, city: c.city, phone: c.phone, email: c.email, notes: c.notes, updated_at: new Date().toISOString() }),
  contact: c => ({ id: c.id, company_id: c.companyId, name: c.name, designation: c.designation, phone: c.phone, email: c.email, role: c.role, influence: c.influence, last_contacted: c.lastContacted || null, notes: c.notes, updated_at: new Date().toISOString() }),
  rc: r => ({ id: r.id, name: r.name, designation: r.designation, region: r.region, city: r.city, phone: r.phone, notes: r.notes, updated_at: new Date().toISOString() }),
  project: p => ({ id: p.id, name: p.name, stage: p.stage, status: p.status, region: p.region, sector: p.sector, path_type: p.pathType, owner_id: p.ownerId || null, epc_id: p.epcId || null, fabricator_ids: p.fabricatorIds || [], kam_owner_id: p.kamOwnerId || null, supporting_kae_ids: p.supportingKaeIds || [], regional_colleague_ids: p.regionalColleagueIds || [], spec_status: p.specStatus, notes: p.notes, expected_order_date: p.expectedOrderDate || null, updated_at: new Date().toISOString() }),
  scope: s => ({ id: s.id, project_id: s.projectId, name: s.name, type: s.type || s.name, data_source: s.dataSource, coatings_potential: s.coatingsPotential || 0, protecton_opportunity: s.protectonOpportunity || 0, qty: s.qty || null, qty_unit: s.qtyUnit, notes: s.notes, products: s.products || [], stage: s.stage, spec_status: s.specStatus, updated_at: new Date().toISOString() }),
  activity: a => ({ id: a.id, project_id: a.projectId, contact_id: a.contactId || null, user_id: a.userId, type: a.type, date: a.date, note: a.note, rc_ids: a.rcIds || [], updated_at: new Date().toISOString() }),
  scopeBuyer: b => ({ id: b.id, scope_id: b.scopeId, company_id: b.companyId || null, sublet_by_id: b.subletById || null, pos: b.pos || [], updated_at: new Date().toISOString() }),
  scopeStakeholder: s => ({ id: s.id, scope_id: s.scopeId, contact_id: s.contactId, role: s.role || null, influence: s.influence || null, notes: s.notes || null, updated_at: new Date().toISOString() }),
}

// ── LOAD ALL DATA ─────────────────────────────────────────────
export function scopeStakeholderFromDb(r){return{id:r.id,scopeId:r.scope_id,contactId:r.contact_id,role:r.role,influence:r.influence,notes:r.notes||''}}
export function scopeStakeholderToDb(s){return{id:s.id,scope_id:s.scopeId,contact_id:s.contactId,role:s.role||null,influence:s.influence||null,notes:s.notes||null,updated_at:new Date().toISOString()}}

export async function loadAll() {
  const tables = ['team', 'companies', 'contacts', 'regional_colleagues', 'projects', 'scopes', 'activities', 'scope_buyers', 'scope_stakeholders']
  const results = await Promise.all(tables.map(t => supabase.from(t).select('*')))
  const errors = results.filter(r => r.error)
  if (errors.length) throw new Error(errors.map(r => r.error.message).join(', '))
  const [team, companies, contacts, rcs, projects, scopes, activities, scopeBuyers, scopeStakeholders] = results.map(r => r.data)
  return {
    team: team.map(fromDb.team),
    companies: companies.map(fromDb.company),
    contacts: contacts.map(fromDb.contact),
    regionalColleagues: rcs.map(fromDb.rc),
    projects: projects.map(fromDb.project),
    scopes: scopes.map(fromDb.scope),
    activities: activities.map(fromDb.activity),
    scopeBuyers: scopeBuyers.map(fromDb.scopeBuyer),
    scopeStakeholders: scopeStakeholders.map(fromDb.scopeStakeholder),
  }
}

// ── UPSERT (normalise keys to prevent PGRST102) ───────────────
export async function upsert(table, rows) {
  if (!rows || rows.length === 0) return
  const clean = rows.filter(r => r && r.id)
  if (!clean.length) return
  const allKeys = [...new Set(clean.flatMap(r => Object.keys(r)))]
  const normalised = clean.map(r => {
    const out = {}
    allKeys.forEach(k => { out[k] = r[k] !== undefined ? r[k] : null })
    return out
  })
  const { error } = await supabase.from(table).upsert(normalised, { onConflict: 'id' })
  if (error) throw new Error(`Save ${table} failed: ${error.message}`)
}

// ── DELETE ────────────────────────────────────────────────────
export async function remove(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(`Delete ${table} failed: ${error.message}`)
}

// ── REALTIME SUBSCRIPTION ─────────────────────────────────────
export function subscribeAll(onChange) {
  const tables = ['projects', 'scopes', 'activities', 'companies', 'contacts', 'regional_colleagues', 'team', 'scope_buyers', 'scope_stakeholders']
  const mappers = { projects: fromDb.project, scopes: fromDb.scope, activities: fromDb.activity, companies: fromDb.company, contacts: fromDb.contact, regional_colleagues: fromDb.rc, team: fromDb.team, scope_buyers: fromDb.scopeBuyer, scope_stakeholders: fromDb.scopeStakeholder }
  const stateKeys = { projects: 'projects', scopes: 'scopes', activities: 'activities', companies: 'companies', contacts: 'contacts', regional_colleagues: 'regionalColleagues', team: 'team', scope_buyers: 'scopeBuyers', scope_stakeholders: 'scopeStakeholders' }

  const channel = supabase.channel('db-changes')
  tables.forEach(table => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
      const key = stateKeys[table]
      const mapper = mappers[table]
      if (!key || !mapper) return
      onChange(key, payload.eventType, payload.eventType === 'DELETE' ? payload.old : mapper(payload.new))
    })
  })
  channel.subscribe(status => {
    console.log('Realtime status:', status)
  })
  return () => supabase.removeChannel(channel)
}
