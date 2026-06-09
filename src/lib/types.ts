import { z } from 'zod'

export interface PhaseWithRankings {
  id: number
  name: string
  responsibility: string
  description: string
  slug: string
  currentUserVote?: {
    modelId: number
    modelName: string
    providerId: number
    providerName: string
    providerSlug: string
  } | null
  models: {
    modelId: number
    modelName: string
    providerId: number
    providerName: string
    providerSlug: string
    voteCount: number
    rank: number
    voters: { userId: number; userName: string; userAvatarUrl: string | null }[]
  }[]
}

export interface ModelResult {
  id: number
  name: string
  providerId: number
  providerName: string
  providerSlug: string
}

export interface ProviderResult {
  id: number
  name: string
  slug: string
}

export interface ApiResponse<T> {
  data: T
  error?: string
}

export const votePayloadSchema = z.object({
  phaseId: z.number().int().positive(),
  modelId: z.number().int().positive(),
  providerId: z.number().int().positive(),
})

export type VotePayload = z.infer<typeof votePayloadSchema>
