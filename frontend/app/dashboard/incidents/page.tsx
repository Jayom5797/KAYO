'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { formatDate, getSeverityColor } from '@/lib/utils'
import { wsClient } from '@/lib/websocket-client'
import Link from 'next/link'

const SEVERITIES = ['', 'critical', 'high', 'medium', 'low']

export default function IncidentsPage() {
  const [severityFilter, setSeverityFilter] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
    wsClient.on('incident.created', handler)
    wsClient.on('incident.updated', handler)
    return () => { wsClient.off('incident.created', handler); wsClient.off('incident.updated', handler) }
  }, [queryClient])

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents', 0, 100, severityFilter],
    queryFn: () => apiClient.getIncidents(0, 100, severityFilter || undefined),
  })

  const filtered = incidents ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Incidents</h1>
          <p className="mt-1 text-sm text-gray-500">Detected threats and suspicious activities</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
          Live
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-2">
        {SEVERITIES.map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              severityFilter === s
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">
          {filtered.length} incident{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-6 w-16 rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-gray-50 stagger">
            {filtered.map((incident: any) => (
              <Link
                key={incident.incident_id}
                href={`/dashboard/incidents/${incident.incident_id}`}
                className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 animate-fade-in group"
              >
                <span className={`mt-0.5 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border flex-shrink-0 ${getSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-black transition-colors">
                    {incident.title || incident.attack_pattern || `Incident ${incident.incident_id.toString().slice(0,8)}`}
                  </p>
                  {incident.description && (
                    <p className="mt-0.5 text-xs text-gray-500 truncate">{incident.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                    <span>{formatDate(incident.created_at)}</span>
                    {incident.mitre_technique && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">
                        {incident.mitre_technique}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                  incident.status === 'new'          ? 'bg-red-50 text-red-600 border border-red-100' :
                  incident.status === 'investigating' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                  'bg-green-50 text-green-700 border border-green-100'
                }`}>
                  {incident.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-fade-in">
            <svg className="w-12 h-12 mb-4 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm font-medium">No incidents found</p>
            <p className="text-xs mt-1">Your environment looks clean</p>
          </div>
        )}
      </div>
    </div>
  )
}
