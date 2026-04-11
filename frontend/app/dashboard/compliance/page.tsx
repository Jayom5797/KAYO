'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export default function CompliancePage() {
  const [eraseConfirm, setEraseConfirm] = useState('')
  const [eraseResult, setEraseResult] = useState<any>(null)
  const [exportData, setExportData] = useState<any>(null)

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['compliance-report'],
    queryFn: () => apiClient.getComplianceReport(),
  })

  const retentionMutation = useMutation({
    mutationFn: () => apiClient.enforceRetention(),
  })

  const eraseMutation = useMutation({
    mutationFn: () => apiClient.eraseData(),
    onSuccess: (data) => setEraseResult(data),
  })

  const exportMutation = useMutation({
    mutationFn: () => apiClient.exportData(),
    onSuccess: (data) => setExportData(data),
  })

  const handleExportDownload = () => {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kayo-data-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
        <p className="mt-1 text-sm text-gray-500">SOC 2 report, GDPR data controls, and retention policies</p>
      </div>

      {/* SOC 2 Report */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">SOC 2 Compliance Report</h2>
          <button onClick={() => refetch()} className="text-sm text-gray-500 hover:text-gray-900">Refresh</button>
        </div>

        {isLoading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : report ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500">Total Audit Logs</div>
                <div className="text-2xl font-bold text-gray-900">{report.audit_logs?.total ?? 0}</div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500">Logs (30 days)</div>
                <div className="text-2xl font-bold text-gray-900">{report.audit_logs?.last_30_days ?? 0}</div>
              </div>
              <div className="bg-red-50 rounded p-3">
                <div className="text-xs text-gray-500">Failed Logins (30d)</div>
                <div className="text-2xl font-bold text-red-700">{report.audit_logs?.failed_login_attempts ?? 0}</div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500">Open Incidents</div>
                <div className="text-2xl font-bold text-gray-900">{report.incidents?.open ?? 0}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Security Controls</h3>
              <div className="space-y-1">
                {report.controls && Object.entries(report.controls).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-700">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Retention Policy</h3>
              <div className="flex gap-4">
                {report.retention_policy && Object.entries(report.retention_policy).map(([key, days]) => (
                  <div key={key} className="bg-gray-50 rounded px-3 py-2 text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}: </span>
                    <span className="font-medium">{days as number} days</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => retentionMutation.mutate()}
              disabled={retentionMutation.isPending}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {retentionMutation.isPending ? 'Running...' : 'Enforce Retention Policy Now'}
            </button>
            {retentionMutation.isSuccess && (
              <p className="text-sm text-green-600">Retention enforcement started in background.</p>
            )}
          </div>
        ) : null}
      </div>

      {/* GDPR Export */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">GDPR — Data Portability (Art. 20)</h2>
        <p className="text-sm text-gray-500 mb-4">Export all your tenant data as JSON.</p>
        <div className="flex gap-3">
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {exportMutation.isPending ? 'Exporting...' : 'Export Data'}
          </button>
          {exportData && (
            <button
              onClick={handleExportDownload}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              Download JSON
            </button>
          )}
        </div>
        {exportData && (
          <p className="mt-2 text-sm text-green-600">
            Export ready: {exportData.incidents?.length ?? 0} incidents, {exportData.deployments?.length ?? 0} deployments
          </p>
        )}
      </div>

      {/* GDPR Erasure */}
      <div className="bg-white rounded-lg shadow p-6 border border-red-100">
        <h2 className="text-lg font-semibold text-red-700 mb-2">GDPR — Right to Erasure (Art. 17)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete all tenant data. This action is irreversible.
          Type <span className="font-mono font-bold">DELETE ALL DATA</span> to confirm.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={eraseConfirm}
            onChange={e => setEraseConfirm(e.target.value)}
            placeholder="DELETE ALL DATA"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
          />
          <button
            onClick={() => eraseMutation.mutate()}
            disabled={eraseConfirm !== 'DELETE ALL DATA' || eraseMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {eraseMutation.isPending ? 'Erasing...' : 'Erase All Data'}
          </button>
        </div>
        {eraseResult && (
          <p className="mt-2 text-sm text-red-600">Data erased: {JSON.stringify(eraseResult.deleted)}</p>
        )}
      </div>
    </div>
  )
}
