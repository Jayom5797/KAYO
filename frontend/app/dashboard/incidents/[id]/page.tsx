'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { formatDate, getSeverityColor } from '@/lib/utils'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const incidentId = params.id as string
  const [notes, setNotes] = useState('')

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', incidentId],
    queryFn: () => apiClient.getIncident(incidentId),
  })

  const updateIncidentMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateIncident(incidentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })

  const handleStatusChange = (status: string) => {
    updateIncidentMutation.mutate({ status })
  }

  const handleAddNote = () => {
    if (!notes.trim()) return
    const currentNotes = incident?.notes || []
    updateIncidentMutation.mutate({
      notes: [...currentNotes, { text: notes, timestamp: new Date().toISOString() }],
    })
    setNotes('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading incident...</div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Incident not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to incidents
        </button>
        <div className="flex items-center gap-2">
          <select
            value={incident.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium border ${getSeverityColor(
                  incident.severity
                )}`}
              >
                {incident.severity}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
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
            <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-gray-500">Detected:</span>
            <span className="ml-2 text-gray-900">{formatDate(incident.detected_at)}</span>
          </div>
          {incident.resolved_at && (
            <div>
              <span className="text-gray-500">Resolved:</span>
              <span className="ml-2 text-gray-900">{formatDate(incident.resolved_at)}</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-700">{incident.description}</p>
        </div>

        {incident.mitre_tactics && incident.mitre_tactics.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">MITRE ATT&CK Tactics</h2>
            <div className="flex flex-wrap gap-2">
              {incident.mitre_tactics.map((tactic: string) => (
                <span
                  key={tactic}
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {tactic}
                </span>
              ))}
            </div>
          </div>
        )}

        {incident.mitre_techniques && incident.mitre_techniques.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">MITRE ATT&CK Techniques</h2>
            <div className="flex flex-wrap gap-2">
              {incident.mitre_techniques.map((technique: string) => (
                <span
                  key={technique}
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {technique}
                </span>
              ))}
            </div>
          </div>
        )}

        {incident.affected_entities && incident.affected_entities.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Affected Entities</h2>
            <div className="bg-gray-50 rounded-md p-4">
              <ul className="space-y-2">
                {incident.affected_entities.map((entity: any, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700">
                    <span className="font-medium">{entity.type}:</span> {entity.id}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Investigation Notes</h2>
        
        <div className="space-y-4 mb-4">
          {incident.notes && incident.notes.length > 0 ? (
            incident.notes.map((note: any, idx: number) => (
              <div key={idx} className="border-l-4 border-gray-300 pl-4 py-2">
                <p className="text-sm text-gray-700">{note.text}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(note.timestamp)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No notes yet</p>
          )}
        </div>

        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add investigation notes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          />
          <button
            onClick={handleAddNote}
            disabled={!notes.trim() || updateIncidentMutation.isPending}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  )
}
