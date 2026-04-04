'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'invitations' | 'webhooks'>('invitations')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const queryClient = useQueryClient()

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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhooks</h2>
          <p className="text-sm text-gray-500">
            Configure webhook integrations for incident notifications
          </p>
        </div>
      )}
    </div>
  )
}
