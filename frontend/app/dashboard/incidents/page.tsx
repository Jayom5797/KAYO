'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { formatDate, getSeverityColor } from '@/lib/utils'
import Link from 'next/link'

export default function IncidentsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('')

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents', 0, 100, severityFilter],
    queryFn: () => apiClient.getIncidents(0, 100, severityFilter || undefined),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Incidents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Detected threats and suspicious activities
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by severity:</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading incidents...</div>
          ) : incidents && incidents.length > 0 ? (
            incidents.map((incident: any) => (
              <Link
                key={incident.incident_id}
                href={`/dashboard/incidents/${incident.incident_id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getSeverityColor(
                          incident.severity
                        )}`}
                      >
                        {incident.severity}
                      </span>
                      <h3 className="text-sm font-medium text-gray-900">
                        {incident.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{incident.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>Detected: {formatDate(incident.detected_at)}</span>
                      {incident.mitre_tactics && incident.mitre_tactics.length > 0 && (
                        <span>Tactics: {incident.mitre_tactics.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                        incident.status === 'open'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : incident.status === 'investigating'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      {incident.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No incidents found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
