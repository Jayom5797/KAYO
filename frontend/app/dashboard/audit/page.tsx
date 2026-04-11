'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, resourceFilter],
    queryFn: () => apiClient.getAuditLogs(0, 100, actionFilter || undefined, resourceFilter || undefined),
  })

  const statusColor = (code: number) => {
    if (code < 300) return 'bg-green-50 text-green-700 border-green-200'
    if (code < 400) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (code < 500) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    return 'bg-red-50 text-red-700 border-red-200'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">Immutable record of all security-sensitive operations</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mr-2">Action</label>
            <input
              type="text"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              placeholder="e.g. login, create"
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mr-2">Resource</label>
            <select
              value={resourceFilter}
              onChange={e => setResourceFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All</option>
              <option value="auth">auth</option>
              <option value="incidents">incidents</option>
              <option value="deployments">deployments</option>
              <option value="tenants">tenants</option>
              <option value="invitations">invitations</option>
              <option value="webhooks">webhooks</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <tr key={log.log_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.action}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="text-xs font-mono font-medium text-gray-600">{log.request_method}</span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500 font-mono max-w-xs truncate">
                      {log.request_path}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusColor(log.response_status)}`}>
                        {log.response_status}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No audit logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
