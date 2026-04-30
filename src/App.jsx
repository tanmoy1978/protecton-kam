import { useState, useEffect, useCallback, useRef } from 'react'
import { loadAll, upsert, remove, subscribeAll, toDb } from './lib/db'
import { DEFAULT_TEAM, uid } from './lib/constants'
import Login from './components/Login'
import Header from './components/Header'
import Projects from './components/Projects'
import ProjectProfile from './components/ProjectProfile'
import Companies from './components/Companies'
import CompanyProfile from './components/CompanyProfile'
import Pipeline from './components/Pipeline'
import ActivityFeed from './components/ActivityFeed'
import Funnel from './components/Funnel'
import Reports from './components/Reports'
import Team from './components/Team'

const VIEWS = ['projects','companies','pipeline','activity','funnel','reports','team']

export default function App() {
  const [data, setData] = useState({
    team: DEFAULT_TEAM,
    companies: [], contacts: [], regionalColleagues: [],
    projects: [], scopes: [], activities: [], scopeBuyers: []
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState('projects')
  const [currentProjectId, setCurrentProjectId] = useState(null)
  const [currentCompanyId, setCurrentCompanyId] = useState(null)
  const [syncStatus, setSyncStatus] = useState('none') // none | syncing | ok | error
  const [syncMsg, setSyncMsg] = useState('Local')
  const unsubRef = useRef(null)

  // ── LOAD ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setSyncStatus('syncing'); setSyncMsg('Loading…')
    try {
      const d = await loadAll()
      // Merge team from DB with defaults
      const merged = DEFAULT_TEAM.map(dt => {
        const ct = d.team.find(u => u.id === dt.id)
        return ct ? { ...dt, ...ct } : dt
      })
      d.team.forEach(u => { if (!merged.find(x => x.id === u.id)) merged.push(u) })
      setData({ ...d, team: merged })
      setSyncStatus('ok'); setSyncMsg('● Live')
      // Start realtime after initial load
      if (unsubRef.current) unsubRef.current()
      unsubRef.current = subscribeAll((key, eventType, row) => {
        setData(prev => {
          const arr = prev[key] || []
          if (eventType === 'DELETE') return { ...prev, [key]: arr.filter(x => x.id !== row.id) }
          const idx = arr.findIndex(x => x.id === row.id)
          const next = idx >= 0 ? arr.map((x, i) => i === idx ? row : x) : [...arr, row]
          return { ...prev, [key]: next }
        })
      })
    } catch (err) {
      console.error('Load failed:', err)
      setSyncStatus('error'); setSyncMsg('Offline')
    }
  }, [])

  useEffect(() => {
    loadData()
    return () => { if (unsubRef.current) unsubRef.current() }
  }, [loadData])

  // ── SAVE ──────────────────────────────────────────────────
  const saveRows = useCallback(async (table, rows, mapper) => {
    setSyncStatus('syncing')
    try {
      await upsert(table, rows.map(mapper))
      setSyncStatus('ok'); setSyncMsg('● Live')
    } catch (err) {
      console.error('Save failed:', err)
      setSyncStatus('error'); setSyncMsg('Save failed')
      setTimeout(() => { setSyncStatus('ok'); setSyncMsg('● Live') }, 3000)
    }
  }, [])

  const saveProject = useCallback(async (project) => {
    setData(prev => {
      const idx = prev.projects.findIndex(p => p.id === project.id)
      const next = idx >= 0 ? prev.projects.map(p => p.id === project.id ? project : p) : [...prev.projects, project]
      return { ...prev, projects: next }
    })
    await saveRows('projects', [project], toDb.project)
  }, [saveRows])

  const deleteProject = useCallback(async (id) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      scopes: prev.scopes.filter(s => s.projectId !== id),
      activities: prev.activities.filter(a => a.projectId !== id),
    }))
    await remove('projects', id)
  }, [])

  const saveScope = useCallback(async (scope) => {
    setData(prev => {
      const idx = prev.scopes.findIndex(s => s.id === scope.id)
      const next = idx >= 0 ? prev.scopes.map(s => s.id === scope.id ? scope : s) : [...prev.scopes, scope]
      return { ...prev, scopes: next }
    })
    await saveRows('scopes', [scope], toDb.scope)
  }, [saveRows])

  const deleteScope = useCallback(async (id) => {
    setData(prev => ({ ...prev, scopes: prev.scopes.filter(s => s.id !== id) }))
    await remove('scopes', id)
  }, [])

  const saveCompany = useCallback(async (company) => {
    setData(prev => {
      const idx = prev.companies.findIndex(c => c.id === company.id)
      const next = idx >= 0 ? prev.companies.map(c => c.id === company.id ? company : c) : [...prev.companies, company]
      return { ...prev, companies: next }
    })
    await saveRows('companies', [company], toDb.company)
  }, [saveRows])

  const deleteCompany = useCallback(async (id) => {
    setData(prev => ({ ...prev, companies: prev.companies.filter(c => c.id !== id) }))
    await remove('companies', id)
  }, [])

  const saveContact = useCallback(async (contact) => {
    setData(prev => {
      const idx = prev.contacts.findIndex(c => c.id === contact.id)
      const next = idx >= 0 ? prev.contacts.map(c => c.id === contact.id ? contact : c) : [...prev.contacts, contact]
      return { ...prev, contacts: next }
    })
    await saveRows('contacts', [contact], toDb.contact)
  }, [saveRows])

  const deleteContact = useCallback(async (id) => {
    setData(prev => ({ ...prev, contacts: prev.contacts.filter(c => c.id !== id) }))
    await remove('contacts', id)
  }, [])

  const saveActivity = useCallback(async (activity) => {
    setData(prev => {
      const idx = prev.activities.findIndex(a => a.id === activity.id)
      const next = idx >= 0 ? prev.activities.map(a => a.id === activity.id ? activity : a) : [...prev.activities, activity]
      return { ...prev, activities: next }
    })
    await saveRows('activities', [activity], toDb.activity)
  }, [saveRows])

  const deleteActivity = useCallback(async (id) => {
    setData(prev => ({ ...prev, activities: prev.activities.filter(a => a.id !== id) }))
    await remove('activities', id)
  }, [])

  const saveScopeBuyer = useCallback(async (buyer) => {
    setData(prev => {
      const idx = prev.scopeBuyers.findIndex(b => b.id === buyer.id)
      const next = idx >= 0 ? prev.scopeBuyers.map(b => b.id === buyer.id ? buyer : b) : [...prev.scopeBuyers, buyer]
      return { ...prev, scopeBuyers: next }
    })
    await saveRows('scope_buyers', [buyer], toDb.scopeBuyer)
  }, [saveRows])

  const deleteScopeBuyer = useCallback(async (id) => {
    setData(prev => ({ ...prev, scopeBuyers: prev.scopeBuyers.filter(b => b.id !== id) }))
    await remove('scope_buyers', id)
  }, [])

  const saveTeamMember = useCallback(async (member) => {
    setData(prev => ({ ...prev, team: prev.team.map(u => u.id === member.id ? member : u) }))
    await saveRows('team', [member], toDb.team)
  }, [saveRows])

  // ── AUTH ──────────────────────────────────────────────────
  const handleLogin = useCallback((user) => {
    setCurrentUser(user)
  }, [])

  const handleLogout = useCallback(() => {
    setCurrentUser(null)
    setView('projects')
    setCurrentProjectId(null)
    setCurrentCompanyId(null)
  }, [])

  const handleSetView = useCallback((v) => {
    setView(v)
    setCurrentProjectId(null)
    setCurrentCompanyId(null)
  }, [])

  if (!currentUser) return <Login team={data.team} onLogin={handleLogin} />

  const ops = {
    saveProject, deleteProject,
    saveScope, deleteScope,
    saveCompany, deleteCompany,
    saveContact, deleteContact,
    saveActivity, deleteActivity,
    saveScopeBuyer, deleteScopeBuyer,
    saveTeamMember,
  }

  const canEdit = true
  const canDelete = currentUser.role === 'National KAM'
  const canManageTeam = currentUser.role === 'National KAM'
  const isNational = currentUser.role === 'National KAM'
  const isKAE = currentUser.role === 'KAE'

  const visibleProjects = data.projects.filter(p => {
    if (isNational || isKAE) return true
    return p.kamOwnerId === currentUser.id || p.region === currentUser.region || (p.supportingKaeIds || []).includes(currentUser.id)
  })

  const ctx = { data, currentUser, ops, canEdit, canDelete, canManageTeam, visibleProjects, uid }

  const renderView = () => {
    if (currentProjectId) return <ProjectProfile {...ctx} projectId={currentProjectId} onBack={() => setCurrentProjectId(null)} />
    if (currentCompanyId) return <CompanyProfile {...ctx} companyId={currentCompanyId} onBack={() => setCurrentCompanyId(null)} onOpenProject={setCurrentProjectId} />
    switch (view) {
      case 'projects': return <Projects {...ctx} onOpenProject={setCurrentProjectId} />
      case 'companies': return <Companies {...ctx} onOpenCompany={setCurrentCompanyId} />
      case 'pipeline': return <Pipeline {...ctx} />
      case 'activity': return <ActivityFeed {...ctx} onOpenProject={setCurrentProjectId} />
      case 'funnel': return <Funnel {...ctx} />
      case 'reports': return <Reports {...ctx} />
      case 'team': return <Team {...ctx} />
      default: return <Projects {...ctx} onOpenProject={setCurrentProjectId} />
    }
  }

  return (
    <div>
      <Header
        currentUser={currentUser}
        view={view}
        setView={handleSetView}
        onLogout={handleLogout}
        onSync={loadData}
        syncStatus={syncStatus}
        syncMsg={syncMsg}
        canManageTeam={canManageTeam}
      />
      <div className="body">
        {renderView()}
      </div>
    </div>
  )
}
