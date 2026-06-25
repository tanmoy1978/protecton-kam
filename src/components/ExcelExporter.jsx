import * as XLSX from 'xlsx'
import { projectCoatingsPotential, projectOpportunity, projectPOTotal, projectBestStage, poCaptureRate } from '../lib/constants'

// ── HELPERS ───────────────────────────────────────────────────
const lakh = v => v ? parseFloat((v).toFixed(2)) : 0
const cr = v => v ? parseFloat((v / 100).toFixed(2)) : 0
const pct = v => v ? parseFloat(v.toFixed(1)) : 0

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 11 },
  fill: { fgColor: { rgb: '2D3748' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: { bottom: { style: 'thin', color: { rgb: 'FFFFFF' } } }
}

const SUBHEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 10 },
  fill: { fgColor: { rgb: '4A7BBF' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center' },
}

const TOTAL_STYLE = {
  font: { bold: true, name: 'Arial', sz: 10 },
  fill: { fgColor: { rgb: 'F5EAC8' }, patternType: 'solid' },
  alignment: { horizontal: 'right' },
}

const applyStyles = (ws, headers, startRow, colWidths) => {
  const range = XLSX.utils.decode_range(ws['!ref'])

  // Header row style
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = XLSX.utils.encode_cell({ r: startRow, c })
    if (ws[cell]) {
      ws[cell].s = HEADER_STYLE
    }
  }

  // Col widths
  ws['!cols'] = colWidths.map(w => ({ wch: w }))

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: startRow + 1, topLeftCell: XLSX.utils.encode_cell({ r: startRow + 1, c: 0 }) }

  return ws
}

const addTitle = (ws, title, subtitle, ncols) => {
  XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
  XLSX.utils.sheet_add_aoa(ws, [[subtitle]], { origin: 'A2' })
  XLSX.utils.sheet_add_aoa(ws, [[`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`]], { origin: 'A3' })
  XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A4' })

  ws['A1'].s = { font: { bold: true, sz: 14, name: 'Arial', color: { rgb: '2D3748' } } }
  ws['A2'].s = { font: { sz: 11, name: 'Arial', color: { rgb: '7A8AA0' } } }
  ws['A3'].s = { font: { sz: 10, name: 'Arial', color: { rgb: '7A8AA0' }, italic: true } }

  // Merge title across columns
  if (!ws['!merges']) ws['!merges'] = []
  ws['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: ncols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: ncols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: ncols - 1 } },
  )
}

// ── REPORT 1: PIPELINE SUMMARY ────────────────────────────────
export function exportPipelineSummary({ data, visibleProjects }) {
  const { scopes, scopeBuyers, team, companies } = data
  const wb = XLSX.utils.book_new()

  const companyName = id => companies.find(c => c.id === id)?.name || '—'
  const userName = id => team.find(u => u.id === id)?.name || '—'

  const headers = [
    'Project Name', 'Sector', 'Region', 'Status', 'Path Type',
    'Project Owner', 'EPC', 'KAM Owner', 'Best Stage',
    'Coatings Potential (₹ Cr)', 'Protecton Opportunity (₹ Cr)',
    'POs Received (₹ Cr)', 'Capture Rate (%)', 'Expected Order Date'
  ]

  const rows = visibleProjects.map(p => {
    const pot = projectCoatingsPotential(p.id, scopes)
    const opp = projectOpportunity(p.id, scopes)
    const po = projectPOTotal(p.id, scopes, scopeBuyers)
    const crRate = poCaptureRate(opp, po)
    const stage = projectBestStage(p.id, scopes)
    return [
      p.name, p.sector || '—', p.region || '—', p.status || 'Active',
      p.pathType || '—', companyName(p.ownerId), companyName(p.epcId),
      userName(p.kamOwnerId), stage || '—',
      cr(pot), cr(opp), cr(po), pct(crRate),
      p.expectedOrderDate || '—'
    ]
  })

  // Totals row
  const totalPot = visibleProjects.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
  const totalOpp = visibleProjects.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
  const totalPO = visibleProjects.reduce((x, p) => x + projectPOTotal(p.id, scopes, scopeBuyers), 0)
  const totalCR = poCaptureRate(totalOpp, totalPO)

  const totalsRow = [
    'TOTAL', '', '', '', '', '', '', '', '',
    cr(totalPot), cr(totalOpp), cr(totalPO), pct(totalCR), ''
  ]

  const wsData = [[], [], [], [], headers, ...rows, [], totalsRow]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  addTitle(ws, 'Protecton KAM — Pipeline Summary', `${visibleProjects.length} Projects`, headers.length)
  applyStyles(ws, headers, 4, [32, 16, 10, 10, 10, 24, 24, 18, 22, 20, 22, 18, 14, 16])

  // Style totals row
  const totalRowIdx = 4 + rows.length + 2
  for (let c = 0; c < headers.length; c++) {
    const cell = XLSX.utils.encode_cell({ r: totalRowIdx, c })
    if (ws[cell]) ws[cell].s = TOTAL_STYLE
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline Summary')
  XLSX.writeFile(wb, `Protecton_Pipeline_Summary_${new Date().toISOString().slice(0,10)}.xlsx`)
}

// ── REPORT 2: KAM-WISE PERFORMANCE ───────────────────────────
export function exportKAMPerformance({ data, visibleProjects }) {
  const { scopes, scopeBuyers, team } = data
  const wb = XLSX.utils.book_new()

  const kamTeam = team.filter(u => u.active !== false)

  // Sheet 1: KAM Summary
  const summaryHeaders = [
    'KAM Name', 'Role', 'Region',
    'Total Projects', 'Active Projects',
    'Coatings Potential (₹ Cr)', 'Protecton Opportunity (₹ Cr)',
    'POs Received (₹ Cr)', 'Capture Rate (%)'
  ]

  const summaryRows = kamTeam.map(u => {
    const myProjects = visibleProjects.filter(p => p.kamOwnerId === u.id)
    const activeP = myProjects.filter(p => p.status === 'Active')
    const pot = myProjects.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
    const opp = myProjects.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
    const po = myProjects.reduce((x, p) => x + projectPOTotal(p.id, scopes, scopeBuyers), 0)
    return [
      u.name, u.role, u.region,
      myProjects.length, activeP.length,
      cr(pot), cr(opp), cr(po), pct(poCaptureRate(opp, po))
    ]
  })

  const ws1Data = [[], [], [], [], summaryHeaders, ...summaryRows]
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data)
  addTitle(ws1, 'Protecton KAM — KAM-wise Performance', 'Team Summary', summaryHeaders.length)
  applyStyles(ws1, summaryHeaders, 4, [24, 18, 12, 14, 14, 22, 24, 20, 14])
  XLSX.utils.book_append_sheet(wb, ws1, 'KAM Summary')

  // Sheet 2: Project detail by KAM
  const detailHeaders = [
    'KAM Owner', 'Project Name', 'Sector', 'Region', 'Status',
    'Best Stage', 'Potential (₹ Cr)', 'Opportunity (₹ Cr)', 'POs (₹ Cr)', 'Capture (%)'
  ]

  const detailRows = []
  kamTeam.forEach(u => {
    const myProjects = visibleProjects.filter(p => p.kamOwnerId === u.id)
    myProjects.forEach(p => {
      const pot = projectCoatingsPotential(p.id, scopes)
      const opp = projectOpportunity(p.id, scopes)
      const po = projectPOTotal(p.id, scopes, scopeBuyers)
      detailRows.push([
        u.name, p.name, p.sector || '—', p.region || '—', p.status || 'Active',
        projectBestStage(p.id, scopes) || '—',
        cr(pot), cr(opp), cr(po), pct(poCaptureRate(opp, po))
      ])
    })
  })

  const ws2Data = [[], [], [], [], detailHeaders, ...detailRows]
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data)
  addTitle(ws2, 'Protecton KAM — Project Detail by KAM', '', detailHeaders.length)
  applyStyles(ws2, detailHeaders, 4, [20, 32, 14, 10, 10, 22, 16, 18, 14, 12])
  XLSX.utils.book_append_sheet(wb, ws2, 'Project Detail')

  XLSX.writeFile(wb, `Protecton_KAM_Performance_${new Date().toISOString().slice(0,10)}.xlsx`)
}

// ── REPORT 3: SECTOR-WISE BREAKDOWN ───────────────────────────
export function exportSectorBreakdown({ data, visibleProjects }) {
  const { scopes, scopeBuyers } = data
  const wb = XLSX.utils.book_new()

  // Get all unique sectors
  const sectors = [...new Set(visibleProjects.map(p => p.sector || 'Other'))].sort()

  // Sheet 1: Sector Summary
  const summaryHeaders = [
    'Sector', 'Total Projects', 'Active Projects',
    'Coatings Potential (₹ Cr)', 'Protecton Opportunity (₹ Cr)',
    'POs Received (₹ Cr)', 'Capture Rate (%)',
    '% of Total Potential'
  ]

  const totalPotAll = visibleProjects.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)

  const summaryRows = sectors.map(sector => {
    const sectorProjects = visibleProjects.filter(p => (p.sector || 'Other') === sector)
    const activeP = sectorProjects.filter(p => p.status === 'Active')
    const pot = sectorProjects.reduce((x, p) => x + projectCoatingsPotential(p.id, scopes), 0)
    const opp = sectorProjects.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
    const po = sectorProjects.reduce((x, p) => x + projectPOTotal(p.id, scopes, scopeBuyers), 0)
    const sharePct = totalPotAll > 0 ? pct((pot / totalPotAll) * 100) : 0
    return [
      sector, sectorProjects.length, activeP.length,
      cr(pot), cr(opp), cr(po), pct(poCaptureRate(opp, po)), sharePct
    ]
  })

  // Totals
  const totalOppAll = visibleProjects.reduce((x, p) => x + projectOpportunity(p.id, scopes), 0)
  const totalPOAll = visibleProjects.reduce((x, p) => x + projectPOTotal(p.id, scopes, scopeBuyers), 0)
  const totalsRow = [
    'TOTAL', visibleProjects.length, visibleProjects.filter(p => p.status === 'Active').length,
    cr(totalPotAll), cr(totalOppAll), cr(totalPOAll), pct(poCaptureRate(totalOppAll, totalPOAll)), 100
  ]

  const ws1Data = [[], [], [], [], summaryHeaders, ...summaryRows, [], totalsRow]
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data)
  addTitle(ws1, 'Protecton KAM — Sector-wise Breakdown', `${sectors.length} Sectors`, summaryHeaders.length)
  applyStyles(ws1, summaryHeaders, 4, [20, 14, 14, 22, 24, 20, 14, 18])

  // Style totals
  const totalRowIdx = 4 + summaryRows.length + 2
  for (let c = 0; c < summaryHeaders.length; c++) {
    const cell = XLSX.utils.encode_cell({ r: totalRowIdx, c })
    if (ws1[cell]) ws1[cell].s = TOTAL_STYLE
  }
  XLSX.utils.book_append_sheet(wb, ws1, 'Sector Summary')

  // Sheet 2: Projects by Sector
  const detailHeaders = [
    'Sector', 'Project Name', 'Region', 'KAM Owner', 'Status',
    'Best Stage', 'Potential (₹ Cr)', 'Opportunity (₹ Cr)', 'POs (₹ Cr)'
  ]

  const detailRows = []
  sectors.forEach(sector => {
    visibleProjects.filter(p => (p.sector || 'Other') === sector).forEach(p => {
      const owner = data.team.find(u => u.id === p.kamOwnerId)
      detailRows.push([
        sector, p.name, p.region || '—', owner?.name || '—', p.status || 'Active',
        projectBestStage(p.id, scopes) || '—',
        cr(projectCoatingsPotential(p.id, scopes)),
        cr(projectOpportunity(p.id, scopes)),
        cr(projectPOTotal(p.id, scopes, scopeBuyers)),
      ])
    })
  })

  const ws2Data = [[], [], [], [], detailHeaders, ...detailRows]
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data)
  addTitle(ws2, 'Protecton KAM — Projects by Sector', '', detailHeaders.length)
  applyStyles(ws2, detailHeaders, 4, [18, 32, 10, 18, 10, 22, 16, 18, 14])
  XLSX.utils.book_append_sheet(wb, ws2, 'Projects by Sector')

  XLSX.writeFile(wb, `Protecton_Sector_Breakdown_${new Date().toISOString().slice(0,10)}.xlsx`)
}
