'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const deploymentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(63, 'Name must be 63 characters or less'),
  image: z.string().min(1, 'Image is required'),
  replicas: z.number().min(1).max(100),
  cpu_request: z.string().regex(/^\d+m$/, 'Must be in format: 100m'),
  memory_request: z.string().regex(/^\d+Mi$/, 'Must be in format: 256Mi'),
  cpu_limit: z.string().regex(/^\d+m$/, 'Must be in format: 1000m'),
  memory_limit: z.string().regex(/^\d+Mi$/, 'Must be in format: 512Mi'),
  env_vars: z.record(z.string()).optional(),
  port: z.number().min(1).max(65535).optional(),
})

type DeploymentFormData = z.infer<typeof deploymentSchema>

export default function NewDeploymentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([])

  const { register, handleSubmit, formState: { errors } } = useForm<DeploymentFormData>({
    resolver: zodResolver(deploymentSchema),
    defaultValues: {
      replicas: 1,
      cpu_request: '100m',
      memory_request: '256Mi',
      cpu_limit: '1000m',
      memory_limit: '512Mi',
    },
  })

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars]
    updated[index][field] = value
    setEnvVars(updated)
  }

  const onSubmit = async (data: DeploymentFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const env_vars: Record<string, string> = {}
      envVars.forEach(({ key, value }) => {
        if (key && value) {
          env_vars[key] = value
        }
      })

      const payload = {
        ...data,
        env_vars: Object.keys(env_vars).length > 0 ? env_vars : undefined,
      }

      const deployment = await apiClient.createDeployment(payload)
      router.push(`/dashboard/deployments/${deployment.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create deployment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Deployment</h1>
        <p className="text-gray-600 mt-1">Deploy a new containerized application</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="my-app"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Container Image</label>
              <input
                {...register('image')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="nginx:latest"
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Replicas</label>
              <input
                {...register('replicas', { valueAsNumber: true })}
                type="number"
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              {errors.replicas && (
                <p className="mt-1 text-sm text-red-600">{errors.replicas.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Port (optional)</label>
              <input
                {...register('port', { valueAsNumber: true })}
                type="number"
                min="1"
                max="65535"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="8080"
              />
              {errors.port && (
                <p className="mt-1 text-sm text-red-600">{errors.port.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">CPU Request</label>
                <input
                  {...register('cpu_request')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="100m"
                />
                {errors.cpu_request && (
                  <p className="mt-1 text-sm text-red-600">{errors.cpu_request.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Memory Request</label>
                <input
                  {...register('memory_request')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="256Mi"
                />
                {errors.memory_request && (
                  <p className="mt-1 text-sm text-red-600">{errors.memory_request.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CPU Limit</label>
                <input
                  {...register('cpu_limit')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="1000m"
                />
                {errors.cpu_limit && (
                  <p className="mt-1 text-sm text-red-600">{errors.cpu_limit.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Memory Limit</label>
                <input
                  {...register('memory_limit')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="512Mi"
                />
                {errors.memory_limit && (
                  <p className="mt-1 text-sm text-red-600">{errors.memory_limit.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Environment Variables</label>
                <Button type="button" variant="outline" size="sm" onClick={addEnvVar}>
                  Add Variable
                </Button>
              </div>

              {envVars.length === 0 ? (
                <p className="text-sm text-gray-500">No environment variables</p>
              ) : (
                <div className="space-y-2">
                  {envVars.map((envVar, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={envVar.key}
                        onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                        placeholder="KEY"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="text"
                        value={envVar.value}
                        onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                        placeholder="value"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeEnvVar(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Deployment'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
