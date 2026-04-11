'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'connection' | 'invitations' | 'webhooks'>('connection')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [backendUrl, setBackendUrl] = useState('')
  const [saved, setSaved] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const stored = localStorage.getItem('backend_url') || 'http://localhost:8000'
    setBackendUrl(stored)
  }, [])

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault()
    const url = backendUrl.replace(/\/$/, '')
    localStorage.setItem('backend_url', url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    window.location.reload()
  }

  const { data: invitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => apiClient.getInvitations(0, 100),
    enabled: activeTab === 'invitations',
  })

  const { data: webhooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => apiClient.getWebhooks(0, 100),
    enabled: activeTab === 'webhooks',
  })

  const createInvitationMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      apiClient.createInvitation(data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      setInviteEmail('')
      setInviteRole('member')
    },
  })

  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => apiClient.revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })

  const handleCreateInvitation = (e: React.FormEvent) => {
    e.preventDefault()
    createInvitationMutation.mutate({ email: inviteEmail, role: inviteRole })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage team members and integrations
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('connection')}
            className={`${
              activeTab === 'connection'
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Connection
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`${
              activeTab === 'invitations'
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Team Members
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`${
              activeTab === 'webhooks'
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Webhooks
          </button>
        </nav>
      </div>

      {activeTab === 'connection' && (
        <div className="bg-white rounded-lg shadow p-6 max-w-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Backend Connection</h2>
          <p className="text-sm text-gray-500 mb-4">
            The frontend connects to the backend via the Next.js proxy. 
            Make sure the backend is running on <span className="font-mono">http://localhost:8000</span>.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-gray-700">Proxy configured → <span className="font-mono">http://localhost:8000</span></span>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            To change the backend URL, update <span className="font-mono">NEXT_PUBLIC_API_URL</span> in <span className="font-mono">frontend/.env.local</span> and restart the frontend.
          </p>
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invite Team Member
            </h2>
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="analyst@security-team.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={createInvitationMutation.isPending}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
              >
                {createInvitationMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations && invitations.length > 0 ? (
                  invitations.map((invitation: any) => (
                    <tr key={invitation.invitation_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invitation.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invitation.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                            invitation.status === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : invitation.status === 'accepted'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {invitation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invitation.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invitation.status === 'pending' && (
                          <button
                            onClick={() =>
                              revokeInvitationMutation.mutate(invitation.invitation_id)
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No invitations
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <WebhooksTab />
      )}
    </div>
  )
}

const EVENT_TYPES = [
  'incident.created', 'incident.updated', 'incident.resolved',
  'deployment.created', 'deployment.failed', 'deployment.succeeded',
  'alert.triggered', '*',
]

function WebhooksTab() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null)
  const [form, setForm] = useState({ name: '', url: '', event_types: ['incident.created'], description: '' })

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => apiClient.getWebhooks(0, 100),
  })

  const { data: deliveries } = useQuery({
    queryKey: ['webhook-deliveries', selectedWebhook?.webhook_id],
    queryFn: () => apiClient.getWebhookDeliveries(selectedWebhook.webhook_id),
    enabled: !!selectedWebhook,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      setShowForm(false)
      setForm({ name: '', url: '', event_types: ['incident.created'], description: '' })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: any) => apiClient.updateWebhook(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      if (selectedWebhook) setSelectedWebhook(null)
    },
  })

  const toggleEventType = (et: string) => {
    setForm(f => ({
      ...f,
      event_types: f.event_types.includes(et)
        ? f.event_types.filter(e => e !== et)
        : [...f.event_types, et],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
          <p className="text-sm text-gray-500">Receive HTTP notifications for platform events</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800"
        >
          {showForm ? 'Cancel' : 'Add Webhook'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">New Webhook</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Slack Alerts"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="url" required value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://hooks.slack.com/..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Types</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(et => (
                  <button
                    key={et} type="button"
                    onClick={() => toggleEventType(et)}
                    className={`px-3 py-1 rounded text-xs font-medium border ${
                      form.event_types.includes(et)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {et}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
              <input
                type="text" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              type="submit" disabled={createMutation.isPending || form.event_types.length === 0}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : webhooks && webhooks.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {webhooks.map((wh: any) => (
                <tr key={wh.webhook_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{wh.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{wh.url}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{wh.event_types.join(', ')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      wh.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {wh.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-3">
                    <button
                      onClick={() => setSelectedWebhook(selectedWebhook?.webhook_id === wh.webhook_id ? null : wh)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Logs
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate({ id: wh.webhook_id, is_active: !wh.is_active })}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {wh.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(wh.webhook_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">No webhooks configured</div>
        )}
      </div>

      {selectedWebhook && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Delivery Logs — {selectedWebhook.name}
          </h3>
          {deliveries && deliveries.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deliveries.map((d: any) => (
                  <tr key={d.delivery_id}>
                    <td className="px-4 py-2 text-gray-700">{d.event_type}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        d.status === 'delivered' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{d.status_code ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{d.attempts}</td>
                    <td className="px-4 py-2 text-gray-500">{formatDate(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No deliveries yet</p>
          )}
        </div>
      )}
    </div>
  )
}
