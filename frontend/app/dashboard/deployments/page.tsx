'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { formatDate, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function DeploymentsPage() {
  const router = useRouter()

  const { data: deployments, isLoading } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => apiClient.getDeployments(0, 100),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your application deployments</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/deployments/new')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors duration-150 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Deployment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton w-2 h-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : deployments && deployments.length > 0 ? (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">App</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 stagger">
              {deployments.map((d: any) => (
                <tr key={d.deployment_id} className="hover:bg-gray-50 transition-colors duration-100 animate-fade-in">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        d.status === 'running' ? 'bg-green-500 animate-pulse-dot' :
                        d.status === 'failed'  ? 'bg-red-500' :
                        d.status === 'pending' ? 'bg-yellow-400' : 'bg-gray-300'
                      }`} />
                      <Link
                        href={`/dashboard/deployments/${d.deployment_id}`}
                        className="text-sm font-medium text-gray-900 hover:text-black transition-colors"
                      >
                        {d.app_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-mono max-w-xs truncate">
                    {d.image_name || d.git_repo}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{formatDate(d.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/deployments/${d.deployment_id}`}
                      className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-fade-in">
            <svg className="w-12 h-12 mb-4 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <p className="text-sm font-medium">No deployments yet</p>
            <button
              onClick={() => router.push('/dashboard/deployments/new')}
              className="mt-3 text-xs text-gray-900 underline underline-offset-2"
            >
              Create your first deployment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
