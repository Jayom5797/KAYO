'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { formatRelativeTime, getSeverityColor, getStatusColor } from '@/lib/utils'
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
    </div>
  )
}
