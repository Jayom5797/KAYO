'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { formatRelativeTime, getSeverityColor } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents', 0, 5],
    queryFn: () => apiClient.getIncidents(0, 5),
  })

  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ['deployments', 0, 5],
    queryFn: () => apiClient.getDeployments(0, 5),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time threat detection and behavior analysis
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Incidents</h2>
            <Link
              href="/dashboard/incidents"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              View all →
            </Link>
          </div>

          {incidentsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : incidents && incidents.length > 0 ? (
            <div className="space-y-3">
              {incidents.map((incident: any) => (
                <Link
                  key={incident.incident_id}
                  href={`/dashboard/incidents/${incident.incident_id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(
                            incident.severity
                          )}`}
                        >
                          {incident.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {incident.title}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatRelativeTime(incident.detected_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No incidents detected
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Deployments</h2>
            <Link
              href="/dashboard/deployments"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              View all →
            </Link>
          </div>

          {deploymentsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : deployments && deployments.length > 0 ? (
            <div className="space-y-3">
              {deployments.map((deployment: any) => (
                <Link
                  key={deployment.deployment_id}
                  href={`/dashboard/deployments/${deployment.deployment_id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {deployment.name}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {deployment.image}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {deployment.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No active deployments
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
