'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import { formatRelativeTime, getSeverityColor, getStatusColor } from '@/lib/utils'
import { analyzeZip, type AnalysisResult } from '@/lib/project-analyzer'
import Link from 'next/link'

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover animate-fade-in">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="skeleton h-3 w-20 mb-3" />
      <div className="skeleton h-8 w-12" />
    </div>
  )
}

export default function DashboardPage() {
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents', 0, 5],
    queryFn: () => apiClient.getIncidents(0, 5),
  })

  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ['deployments', 0, 5],
    queryFn: () => apiClient.getDeployments(0, 5),
  })

  const criticalCount = incidents?.filter((i: any) => i.severity === 'critical').length ?? 0
  const openCount     = incidents?.filter((i: any) => i.status === 'new').length ?? 0
  const runningDeps   = deployments?.filter((d: any) => d.status === 'running').length ?? 0

  // Project analyzer state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.zip')) { setAnalyzeError('Please upload a .zip file'); return }
    setAnalyzing(true)
    setAnalyzeError(null)
    setAnalysis(null)
    try {
      const result = await analyzeZip(file)
      setAnalysis(result)
      setShowAnalysis(true)
    } catch (err: any) {
      setAnalyzeError(err.message || 'Failed to analyze ZIP')
    } finally {
      setAnalyzing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">Security Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time threat detection and behavior analysis</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {incidentsLoading || deploymentsLoading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Incidents"  value={incidents?.length ?? 0} sub="all time" />
            <StatCard label="Open"             value={openCount}    sub="need attention" color={openCount > 0 ? 'text-red-600' : 'text-gray-900'} />
            <StatCard label="Critical"         value={criticalCount} sub="high priority"  color={criticalCount > 0 ? 'text-red-600' : 'text-gray-900'} />
            <StatCard label="Active Deploys"   value={runningDeps}  sub="running now"    color="text-green-600" />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Incidents</h2>
            <Link href="/dashboard/incidents" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {incidentsLoading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
              </div>
            ) : incidents && incidents.length > 0 ? (
              <div className="stagger">
                {incidents.map((incident: any) => (
                  <Link
                    key={incident.incident_id}
                    href={`/dashboard/incidents/${incident.incident_id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 animate-fade-in"
                  >
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {incident.title || incident.attack_pattern || `Incident ${incident.incident_id.toString().slice(0,8)}`}
                      </p>
                      <p className="text-xs text-gray-400">{formatRelativeTime(incident.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      incident.status === 'new' ? 'bg-red-50 text-red-600' :
                      incident.status === 'resolved' ? 'bg-green-50 text-green-600' :
                      'bg-yellow-50 text-yellow-600'
                    }`}>{incident.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-sm">No incidents detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Deployments */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Active Deployments</h2>
            <Link href="/dashboard/deployments" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {deploymentsLoading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
              </div>
            ) : deployments && deployments.length > 0 ? (
              <div className="stagger">
                {deployments.map((deployment: any) => (
                  <Link
                    key={deployment.deployment_id}
                    href={`/dashboard/deployments/${deployment.deployment_id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 animate-fade-in"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      deployment.status === 'running' ? 'bg-green-500 animate-pulse-dot' :
                      deployment.status === 'failed'  ? 'bg-red-500' : 'bg-yellow-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{deployment.app_name}</p>
                      <p className="text-xs text-gray-400 truncate">{deployment.image_name || deployment.git_repo}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusColor(deployment.status)}`}>
                      {deployment.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <p className="text-sm">No active deployments</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Analyzer */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Project Analyzer</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload your project ZIP to analyze code quality, security, endpoints, and services</p>
          </div>
          <div className="flex items-center gap-3">
            {analysis && (
              <button onClick={() => setShowAnalysis(!showAnalysis)} className="text-xs text-gray-500 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50">
                {showAnalysis ? 'Hide Report' : 'Show Report'}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".zip" onChange={handleZipUpload} className="hidden" id="zip-upload" />
            <label htmlFor="zip-upload" className={`cursor-pointer px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${analyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}>
              {analyzing ? 'Analyzing...' : analysis ? 'Re-analyze ZIP' : 'Upload ZIP'}
            </label>
          </div>
        </div>

        {analyzeError && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-sm text-red-600">{analyzeError}</div>
        )}

        {analyzing && (
          <div className="px-6 py-12 text-center">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Analyzing project structure...</p>
          </div>
        )}

        {analysis && showAnalysis && (
          <div className="p-6 space-y-6">

            {/* Frameworks + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Frameworks & Stack</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.frameworks.map((f, i) => (
                    <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      f.type === 'frontend' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      f.type === 'backend'  ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {f.name}{f.version ? ` ${f.version}` : ''}
                    </span>
                  ))}
                  {analysis.frameworks.length === 0 && <span className="text-xs text-gray-400">No frameworks detected</span>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Code Stats</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{analysis.stats.totalFiles}</div>
                    <div className="text-xs text-gray-500">Files</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{analysis.stats.totalLines.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Lines</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{Object.keys(analysis.stats.languages).length}</div>
                    <div className="text-xs text-gray-500">Languages</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(analysis.stats.languages).sort((a,b) => b[1]-a[1]).slice(0,5).map(([lang, lines]) => (
                    <span key={lang} className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{lang}: {lines.toLocaleString()}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Services Detected</p>
              {analysis.services.filter(s => s.found).length === 0 ? (
                <p className="text-xs text-gray-400">No known services detected</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {analysis.services.filter(s => s.found).map((svc, i) => (
                    <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-800">{svc.name}</div>
                        {svc.sources.length > 0 && (
                          <div className="text-xs text-gray-400 truncate max-w-[140px]" title={svc.sources.join(', ')}>{svc.sources[0]}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Endpoints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Open Endpoints <span className="text-gray-400 font-normal">({analysis.openEndpoints.length})</span>
                </p>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {analysis.openEndpoints.length === 0 ? (
                    <div className="p-4 text-xs text-gray-400">None detected</div>
                  ) : analysis.openEndpoints.map((ep, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                        ep.method === 'GET' ? 'bg-green-100 text-green-700' :
                        ep.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{ep.method}</span>
                      <span className="text-xs font-mono text-gray-700 flex-1 truncate">{ep.path}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Protected Endpoints <span className="text-gray-400 font-normal">({analysis.protectedEndpoints.length})</span>
                </p>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {analysis.protectedEndpoints.length === 0 ? (
                    <div className="p-4 text-xs text-gray-400">None detected</div>
                  ) : analysis.protectedEndpoints.map((ep, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                        ep.method === 'GET' ? 'bg-green-100 text-green-700' :
                        ep.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                        ep.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{ep.method}</span>
                      <span className="text-xs font-mono text-gray-700 flex-1 truncate">{ep.path}</span>
                      <span className="text-xs text-yellow-600">🔒</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Code Quality + Security */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Code Quality</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${analysis.codeQuality.score >= 80 ? 'bg-green-500' : analysis.codeQuality.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${analysis.codeQuality.score}%` }} />
                    </div>
                    <span className={`text-sm font-bold ${analysis.codeQuality.score >= 80 ? 'text-green-600' : analysis.codeQuality.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {analysis.codeQuality.score}/100
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {analysis.codeQuality.issues.map((issue, i) => (
                    <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                      issue.severity === 'error' ? 'bg-red-50 text-red-700' :
                      issue.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      <span>{issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : '✓'}</span>
                      <span>{issue.message}{issue.file ? ` (${issue.file})` : ''}</span>
                    </div>
                  ))}
                  {analysis.codeQuality.positives.map((p, i) => (
                    <div key={`pos-${i}`} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-green-50 text-green-700">
                      <span>✓</span><span>{p}</span>
                    </div>
                  ))}
                  {analysis.duplicateEndpoints.length > 0 && (
                    <div className="flex items-start gap-2 text-xs p-2 rounded-lg bg-red-50 text-red-700">
                      <span>✗</span>
                      <span>Duplicate endpoints: {analysis.duplicateEndpoints.map(d => `${d.method} ${d.path} (×${d.count})`).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Security</p>
                <div className="space-y-2">
                  {analysis.security.issues.map((issue, i) => (
                    <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                      issue.severity === 'error' ? 'bg-red-50 text-red-700' :
                      issue.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      <span>{issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : '✓'}</span>
                      <span>{issue.message}{issue.file ? ` (${issue.file})` : ''}</span>
                    </div>
                  ))}
                </div>
                {analysis.envFiles.length > 0 && (
                  <div className="mt-3 p-2 bg-green-50 rounded-lg text-xs text-green-700">
                    ✓ .env files found: {analysis.envFiles.map(f => f.split('/').pop()).join(', ')}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {!analysis && !analyzing && (
          <div className="px-6 py-10 text-center text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Upload a ZIP of your project to get a full analysis report</p>
            <p className="text-xs mt-1">All analysis runs locally in your browser — no data is uploaded anywhere</p>
          </div>
        )}
      </div>

    </div>
  )
}
