'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatRelativeTime } from '@/lib/utils'

interface DepStatus { status: 'up' | 'down'; response_ms?: number; error?: string }
interface CheckResult {
  url: string; status: 'up' | 'down' | 'checking'
  statusCode?: number; responseTime?: number; checkedAt: string
  error?: string; version?: string; service?: string
  dependencies?: Record<string, DepStatus>
}
interface HistoryEntry { status: 'up' | 'down'; responseTime?: number; checkedAt: string }
interface EndpointResult {
  method: string; path: string; summary?: string
  status: 'up' | 'down' | 'checking' | 'idle'
  statusCode?: number; responseTime?: number; checkedAt?: string; error?: string
}

const DEP_LABELS: Record<string, string> = {
  postgresql: 'PostgreSQL', redis: 'Redis', kafka: 'Kafka',
  neo4j: 'Neo4j', clickhouse: 'ClickHouse',
}
const METHOD_COLOR: Record<string, string> = {
  GET: 'bg-green-100 text-green-700', POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700', PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
}

function StatusDot({ status }: { status: string }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
    status === 'up' ? 'bg-green-500' :
    status === 'down' ? 'bg-red-500' :
    status === 'checking' ? 'bg-yellow-400 animate-pulse' :
    'bg-gray-300'
  }`} />
}

export default function MonitorPage() {
  const [inputUrl, setInputUrl] = useState('')
  const [monitors, setMonitors] = useState<string[]>([])
  const [results, setResults] = useState<Record<string, CheckResult>>({})
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({})
  const [endpoints, setEndpoints] = useState<Record<string, EndpointResult[]>>({})
  const [specStatus, setSpecStatus] = useState<Record<string, string>>({})
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({})
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('kayo_monitors_v3')
    if (saved) { try { setMonitors(JSON.parse(saved)) } catch {} }
  }, [])

  const saveMonitors = (list: string[]) => {
    localStorage.setItem('kayo_monitors_v3', JSON.stringify(list))
    setMonitors(list)
  }

  const checkUrl = useCallback(async (url: string) => {
    setResults(prev => ({ ...prev, [url]: { ...prev[url], url, status: 'checking', checkedAt: new Date().toISOString() } }))
    try {
      const res = await fetch(`/api/monitor/check?url=${encodeURIComponent(url)}`, { cache: 'no-store' })
      const data = await res.json()
      const entry: CheckResult = {
        url, status: data.ok ? 'up' : 'down', statusCode: data.status_code,
        responseTime: data.response_time_ms, checkedAt: new Date().toISOString(),
        error: data.error, version: data.body?.version, service: data.body?.service,
        dependencies: data.body?.dependencies,
      }
      setResults(prev => ({ ...prev, [url]: entry }))
      setHistory(prev => {
        const newEntry: HistoryEntry = { status: entry.status === 'up' ? 'up' : 'down', responseTime: data.response_time_ms, checkedAt: entry.checkedAt }
        const list: HistoryEntry[] = [newEntry, ...(prev[url] || [])].slice(0, 40)
        return { ...prev, [url]: list }
      })
    } catch (e: any) {
      setResults(prev => ({ ...prev, [url]: { url, status: 'down', checkedAt: new Date().toISOString(), error: e.message } }))
    }
  }, [])

  const fetchSpec = useCallback(async (url: string) => {
    setSpecStatus(prev => ({ ...prev, [url]: 'loading' }))
    try {
      const res = await fetch(`/api/monitor/spec?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (!data.found) { setSpecStatus(prev => ({ ...prev, [url]: 'not_found' })); return }

      const spec = data.spec
      const paths = spec.paths || {}
      const discovered: EndpointResult[] = []

      Object.entries(paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, info]: [string, any]) => {
          if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
            discovered.push({
              method: method.toUpperCase(), path,
              summary: (info as any).summary || '',
              status: 'idle',
            })
          }
        })
      })

      setEndpoints(prev => ({ ...prev, [url]: discovered }))
      setSpecStatus(prev => ({ ...prev, [url]: `found:${data.path} (${discovered.length} endpoints)` }))
    } catch {
      setSpecStatus(prev => ({ ...prev, [url]: 'error' }))
    }
  }, [])

  const checkEndpoint = useCallback(async (baseUrl: string, ep: EndpointResult) => {
    const fullUrl = baseUrl.replace(/\/$/, '') + ep.path
    setEndpoints(prev => ({
      ...prev,
      [baseUrl]: (prev[baseUrl] || []).map(e =>
        e.method === ep.method && e.path === ep.path ? { ...e, status: 'checking' } : e
      )
    }))
    try {
      const res = await fetch(`/api/monitor/endpoint?url=${encodeURIComponent(fullUrl)}`)
      const data = await res.json()
      setEndpoints(prev => ({
        ...prev,
        [baseUrl]: (prev[baseUrl] || []).map(e =>
          e.method === ep.method && e.path === ep.path
            ? { ...e, status: data.ok ? 'up' : 'down', statusCode: data.status_code, responseTime: data.response_time_ms, checkedAt: new Date().toISOString(), error: data.error }
            : e
        )
      }))
    } catch {}
  }, [])

  const checkAllEndpoints = useCallback(async (baseUrl: string) => {
    const eps = endpoints[baseUrl] || []
    // Only check GET endpoints to avoid side effects
    const getEndpoints = eps.filter(e => e.method === 'GET')
    for (const ep of getEndpoints) {
      await checkEndpoint(baseUrl, ep)
    }
  }, [endpoints, checkEndpoint])

  useEffect(() => {
    if (!monitors.length) return
    monitors.forEach(url => checkUrl(url))
    if (!autoRefresh) return
    const timer = setInterval(() => monitors.forEach(url => checkUrl(url)), 30000)
    return () => clearInterval(timer)
  }, [monitors, autoRefresh, checkUrl])

  const addMonitor = (e: React.FormEvent) => {
    e.preventDefault()
    let url = inputUrl.trim()
    if (!url) return
    if (!url.startsWith('http')) url = 'http://' + url
    url = url.replace(/\/$/, '')
    if (monitors.includes(url)) { setInputUrl(''); return }
    saveMonitors([...monitors, url])
    setInputUrl('')
    checkUrl(url)
  }

  const removeMonitor = (url: string) => {
    saveMonitors(monitors.filter(u => u !== url))
    setResults(prev => { const n = { ...prev }; delete n[url]; return n })
    setHistory(prev => { const n = { ...prev }; delete n[url]; return n })
    setEndpoints(prev => { const n = { ...prev }; delete n[url]; return n })
    setSpecStatus(prev => { const n = { ...prev }; delete n[url]; return n })
  }

  const uptimePercent = (url: string) => {
    const h = history[url] || []
    if (!h.length) return null
    return Math.round((h.filter(e => e.status === 'up').length / h.length) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backend Monitor</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor health, dependencies, and auto-discover all API endpoints via OpenAPI spec</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
          Auto-refresh (30s)
        </label>
      </div>

      {/* Add URL */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Add Backend URL</h2>
        <form onSubmit={addMonitor} className="flex gap-3">
          <input
            type="text" value={inputUrl} onChange={e => setInputUrl(e.target.value)}
            placeholder="http://localhost:8000 or https://api.yourdomain.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button type="submit" disabled={!inputUrl.trim()}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50">
            Add & Monitor
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">
          Checks <span className="font-mono">/health</span> every 30s. Use &quot;Discover Endpoints&quot; to auto-load all API routes from the OpenAPI spec.
        </p>
      </div>

      {monitors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400 text-sm">
          No backends monitored yet. Add a URL above to start.
        </div>
      ) : (
        <div className="space-y-6">
          {monitors.map(url => {
            const r = results[url]
            const uptime = uptimePercent(url)
            const hist = history[url] || []
            const eps = endpoints[url] || []
            const spec = specStatus[url]
            const isExpanded = expandedEndpoints[url]

            return (
              <div key={url} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <StatusDot status={r?.status || 'idle'} />
                    <div>
                      <p className="text-sm font-mono font-medium text-gray-900">{url}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r?.service && <span className="mr-2">{r.service}</span>}
                        {r?.version && <span className="mr-2">v{r.version}</span>}
                        {r?.checkedAt && r.status !== 'checking' && <span>Last checked {formatRelativeTime(r.checkedAt)}</span>}
                        {r?.status === 'checking' && <span>Checking...</span>}
                        {r?.error && <span className="text-red-500 ml-2">{r.error}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => checkUrl(url)} className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded px-2 py-1">Check now</button>
                    <button onClick={() => removeMonitor(url)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 grid grid-cols-4 gap-4 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">API Status</div>
                    <div className={`text-sm font-semibold ${!r || r.status === 'checking' ? 'text-gray-400' : r.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {!r || r.status === 'checking' ? '—' : r.status === 'up' ? 'UP' : 'DOWN'}
                    </div>
                    {r?.statusCode && <div className="text-xs text-gray-400">HTTP {r.statusCode}</div>}
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Response Time</div>
                    <div className="text-sm font-semibold text-gray-900">{r?.responseTime ? `${r.responseTime}ms` : '—'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Uptime</div>
                    <div className={`text-sm font-semibold ${uptime === null ? 'text-gray-400' : uptime >= 99 ? 'text-green-600' : uptime >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {uptime !== null ? `${uptime}%` : '—'}
                    </div>
                    <div className="text-xs text-gray-400">{hist.length} checks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Error Rate</div>
                    <div className={`text-sm font-semibold ${uptime === null ? 'text-gray-400' : (100 - uptime) === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {uptime !== null ? `${100 - uptime}%` : '—'}
                    </div>
                  </div>
                </div>

                {/* Dependencies */}
                {r?.dependencies && Object.keys(r.dependencies).length > 0 && (
                  <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Service Dependencies</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {Object.entries(r.dependencies).map(([key, dep]) => (
                        <div key={key} className={`rounded-lg p-3 border ${dep.status === 'up' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <StatusDot status={dep.status} />
                            <span className="text-xs font-medium text-gray-700">{DEP_LABELS[key] || key}</span>
                          </div>
                          <div className={`text-xs font-semibold ${dep.status === 'up' ? 'text-green-700' : 'text-red-700'}`}>{dep.status === 'up' ? 'UP' : 'DOWN'}</div>
                          {dep.response_ms && <div className="text-xs text-gray-500">{dep.response_ms}ms</div>}
                          {dep.error && <div className="text-xs text-red-500 truncate" title={dep.error}>{dep.error}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History bar */}
                {hist.length > 0 && (
                  <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Response time history ({hist.length} checks)</p>
                    <div className="flex items-end gap-0.5 h-10">
                      {[...hist].reverse().map((h, i) => {
                        const maxMs = Math.max(...hist.filter(e => e.responseTime).map(e => e.responseTime || 0), 1)
                        const height = h.responseTime ? Math.max(4, Math.round((h.responseTime / maxMs) * 40)) : 4
                        return (
                          <div key={i} style={{ height: `${height}px` }}
                            title={`${h.status.toUpperCase()} · ${h.responseTime ? h.responseTime + 'ms · ' : ''}${formatRelativeTime(h.checkedAt)}`}
                            className={`flex-1 rounded-sm ${h.status === 'up' ? 'bg-green-400' : 'bg-red-400'}`} />
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* OpenAPI Endpoint Discovery */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 uppercase">API Endpoints</p>
                      {spec && (
                        <p className={`text-xs mt-0.5 ${spec.startsWith('found') ? 'text-green-600' : spec === 'loading' ? 'text-gray-400' : 'text-red-500'}`}>
                          {spec === 'loading' ? 'Discovering...' : spec.startsWith('found') ? `✓ ${spec.replace('found:', '')}` : '✗ No OpenAPI spec found'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {eps.length > 0 && (
                        <>
                          <button onClick={() => checkAllEndpoints(url)}
                            className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50">
                            Check all GET
                          </button>
                          <button onClick={() => setExpandedEndpoints(prev => ({ ...prev, [url]: !isExpanded }))}
                            className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50">
                            {isExpanded ? 'Collapse' : `Show ${eps.length} endpoints`}
                          </button>
                        </>
                      )}
                      <button onClick={() => fetchSpec(url)}
                        className="text-xs bg-black text-white rounded px-3 py-1 hover:bg-gray-800">
                        {spec === 'loading' ? 'Loading...' : eps.length > 0 ? 'Re-discover' : 'Discover Endpoints'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && eps.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-20">Method</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Path</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Summary</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-24">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-20">Time</th>
                            <th className="px-4 py-2 w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {eps.map((ep, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold ${METHOD_COLOR[ep.method] || 'bg-gray-100 text-gray-700'}`}>
                                  {ep.method}
                                </span>
                              </td>
                              <td className="px-4 py-2 font-mono text-xs text-gray-800">{ep.path}</td>
                              <td className="px-4 py-2 text-xs text-gray-500 hidden md:table-cell">{ep.summary}</td>
                              <td className="px-4 py-2">
                                {ep.status === 'idle' ? <span className="text-xs text-gray-400">—</span> :
                                 ep.status === 'checking' ? <span className="text-xs text-yellow-500 animate-pulse">checking</span> : (
                                  <div className="flex items-center gap-1.5">
                                    <StatusDot status={ep.status} />
                                    <span className={`text-xs font-medium ${ep.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                      {ep.statusCode || (ep.status === 'up' ? 'UP' : 'DOWN')}
                                    </span>
                                    {(ep.statusCode === 401 || ep.statusCode === 403) && (
                                      <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-1">🔒 Protected</span>
                                    )}
                                    {ep.status === 'up' && ep.statusCode && ep.statusCode < 400 && (
                                      <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-1">Public</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-500">
                                {ep.responseTime ? `${ep.responseTime}ms` : '—'}
                              </td>
                              <td className="px-4 py-2">
                                {ep.method === 'GET' && (
                                  <button onClick={() => checkEndpoint(url, ep)}
                                    className="text-xs text-gray-500 hover:text-gray-900">
                                    Check
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
