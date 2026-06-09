import { sql, eq, and } from 'drizzle-orm'
import { getDb, type Db } from '@/db'
import * as schema from '@/db/schema'
import type { PhaseWithRankings, ModelResult, ProviderResult } from './types'

export async function getPhases(
  db: Db,
  providerIds?: number[],
  currentUserClerkId?: string,
): Promise<PhaseWithRankings[]> {
  const { phases, votes, users, models, providers } = schema

  // Get all phases
  const allPhases = await db.select().from(phases).orderBy(phases.id)

  // Use raw SQL for RANK() window function — Drizzle query builder doesn't support it well
  const providerCondition = providerIds?.length ? `AND v.provider_id IN (${providerIds.join(',')})` : ''
  const rawResult = await db.execute(sql`
    WITH ranked AS (
      SELECT
        v.phase_id,
        m.id as model_id,
        m.name as model_name,
        p.id as provider_id,
        p.name as provider_name,
        p.slug as provider_slug,
        COUNT(v.id) as vote_count,
        RANK() OVER (PARTITION BY v.phase_id ORDER BY COUNT(v.id) DESC) as rank
      FROM votes v
      INNER JOIN models m ON v.model_id = m.id
      INNER JOIN providers p ON v.provider_id = p.id
      INNER JOIN users u ON v.user_id = u.id
      WHERE 1=1 ${sql.raw(providerCondition)}
      GROUP BY v.phase_id, m.id, m.name, p.id, p.name, p.slug
    ),
    voters AS (
      SELECT
        v.phase_id,
        v.model_id,
        u.id as user_id,
        u.name as user_name,
        u.avatar_url as user_avatar_url
      FROM votes v
      INNER JOIN users u ON v.user_id = u.id
    )
    SELECT r.*, COALESCE(
      json_agg(json_build_object(
        'userId', vo.user_id,
        'userName', vo.user_name,
        'userAvatarUrl', vo.user_avatar_url
      )) FILTER (WHERE vo.user_id IS NOT NULL),
      '[]'::json
    ) as voters
    FROM ranked r
    LEFT JOIN voters vo ON r.phase_id = vo.phase_id AND r.model_id = vo.model_id
    WHERE r.rank <= 2
    GROUP BY r.phase_id, r.model_id, r.model_name, r.provider_id, r.provider_name, r.provider_slug, r.vote_count, r.rank
    ORDER BY r.phase_id, r.rank
  `)

  const rows = rawResult.rows as Array<{
    phase_id: number
    model_id: number
    model_name: string
    provider_id: number
    provider_name: string
    provider_slug: string
    vote_count: number
    rank: number
    voters: Array<{ userId: number; userName: string; userAvatarUrl: string | null }>
  }>

  const currentUserVoteRows = currentUserClerkId
    ? await db
      .select({
        phaseId: votes.phaseId,
        modelId: models.id,
        modelName: models.name,
        providerId: providers.id,
        providerName: providers.name,
        providerSlug: providers.slug,
      })
      .from(votes)
      .innerJoin(users, eq(votes.userId, users.id))
      .innerJoin(models, eq(votes.modelId, models.id))
      .innerJoin(providers, eq(votes.providerId, providers.id))
      .where(eq(users.clerkId, currentUserClerkId))
    : []

  const currentUserVotesByPhase = new Map(
    currentUserVoteRows.map((vote) => [
      vote.phaseId,
      {
        modelId: vote.modelId,
        modelName: vote.modelName,
        providerId: vote.providerId,
        providerName: vote.providerName,
        providerSlug: vote.providerSlug,
      },
    ]),
  )

  // Group by phase
  return allPhases.map(phase => ({
    id: phase.id,
    name: phase.name,
    responsibility: phase.responsibility,
    description: phase.description,
    slug: phase.slug,
    currentUserVote: currentUserVotesByPhase.get(phase.id) ?? null,
    models: rows
      .filter(r => r.phase_id === phase.id)
      .map(r => ({
        modelId: r.model_id,
        modelName: r.model_name,
        providerId: r.provider_id,
        providerName: r.provider_name,
        providerSlug: r.provider_slug,
        voteCount: r.vote_count,
        rank: r.rank,
        voters: r.voters || [],
      })),
  }))
}

export async function getModels(
  db: Db,
  providerId?: number,
): Promise<ModelResult[]> {
  const { models, providers } = schema

  const conditions = providerId ? [eq(models.providerId, providerId)] : []

  const result = await db
    .select({
      id: models.id,
      name: models.name,
      providerId: models.providerId,
      providerName: providers.name,
      providerSlug: providers.slug,
    })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .where(and(...conditions))
    .orderBy(models.name)

  return result
}

export async function getProviders(
  db: Db,
): Promise<ProviderResult[]> {
  const { providers } = schema

  return db.select().from(providers).orderBy(providers.name)
}

export async function upsertVote(
  db: Db,
  userId: number,
  phaseId: number,
  modelId: number,
  providerId: number,
) {
  const { votes, voteHistory } = schema

  // Check if vote already exists
  const existing = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.phaseId, phaseId)))
    .limit(1)

  if (existing.length > 0) {
    const oldVote = existing[0]

    // Update the vote
    const [updated] = await db
      .update(votes)
      .set({
        modelId,
        providerId,
        updatedAt: new Date(),
      })
      .where(eq(votes.id, oldVote.id))
      .returning()

    // Insert history
    const [history] = await db
      .insert(voteHistory)
      .values({
        voteId: oldVote.id,
        oldModelId: oldVote.modelId,
        oldProviderId: oldVote.providerId,
        newModelId: modelId,
        newProviderId: providerId,
      })
      .returning()

    return { vote: updated, history }
  }

  // Insert new vote
  const [vote] = await db
    .insert(votes)
    .values({ userId, phaseId, modelId, providerId })
    .returning()

  // Insert initial history
  const [history] = await db
    .insert(voteHistory)
    .values({
      voteId: vote.id,
      oldModelId: null,
      oldProviderId: null,
      newModelId: modelId,
      newProviderId: providerId,
    })
    .returning()

  return { vote, history }
}
