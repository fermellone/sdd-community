import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import type { Db } from '@/db'
import * as schema from '@/db/schema'

// We'll test queries against a real PGlite instance
let db: Db

beforeAll(async () => {
  const pg = new PGlite()
  db = drizzle(pg, { schema }) as Db

  // Create tables manually since we can't run drizzle migrations in PGlite easily
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS phases (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      responsibility TEXT NOT NULL,
      description TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS models (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      provider_id INTEGER NOT NULL REFERENCES providers(id)
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      clerk_id TEXT NOT NULL UNIQUE,
      name TEXT,
      avatar_url TEXT
    );
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      phase_id INTEGER NOT NULL REFERENCES phases(id),
      model_id INTEGER NOT NULL REFERENCES models(id),
      provider_id INTEGER NOT NULL REFERENCES providers(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, phase_id)
    );
    CREATE TABLE IF NOT EXISTS vote_history (
      id SERIAL PRIMARY KEY,
      vote_id INTEGER NOT NULL REFERENCES votes(id),
      old_model_id INTEGER REFERENCES models(id),
      old_provider_id INTEGER REFERENCES providers(id),
      new_model_id INTEGER NOT NULL REFERENCES models(id),
      new_provider_id INTEGER NOT NULL REFERENCES providers(id),
      changed_at TIMESTAMP DEFAULT NOW()
    );
  `)

  // Seed data
  await pg.exec(`
    INSERT INTO providers (name, slug) VALUES
      ('OpenAI Plus', 'openai-plus'),
      ('Anthropic Pro', 'anthropic-pro'),
      ('OpenRouter (Free)', 'openrouter-free');
    INSERT INTO phases (name, responsibility, description, slug) VALUES
      ('sdd-explore', 'Exploración', 'Investigación inicial', 'sdd-explore'),
      ('sdd-propose', 'Propuesta', 'Redacción de propuesta', 'sdd-propose');
    INSERT INTO models (name, provider_id) VALUES
      ('gpt-4o', 1),
      ('gpt-4o-mini', 1),
      ('claude-sonnet-4', 2),
      ('claude-haiku-3.5', 2),
      ('gemini-2.5-flash', 3);
    INSERT INTO users (clerk_id, name, avatar_url) VALUES
      ('user_001', 'Fer', null),
      ('user_002', 'Ana', null),
      ('user_003', 'Luis', null);
    INSERT INTO votes (user_id, phase_id, model_id, provider_id) VALUES
      (1, 1, 1, 1),
      (2, 1, 3, 2),
      (3, 1, 3, 2),
      (1, 2, 3, 2);
  `)
})

describe('getPhases', () => {
  it('returns phases with ranked models', async () => {
    const { getPhases } = await import('../queries')
    const phases = await getPhases(db)

    expect(phases).toHaveLength(2)

    const explore = phases.find(p => p.slug === 'sdd-explore')!
    expect(explore.models).toHaveLength(2)

    // claude-sonnet-4 should be rank 1 (2 votes from users 2 and 3)
    expect(explore.models[0].modelName).toBe('claude-sonnet-4')
    expect(explore.models[0].voteCount).toBe(2)
    expect(explore.models[0].rank).toBe(1)

    // gpt-4o should be rank 2 (1 vote from user 1)
    expect(explore.models[1].modelName).toBe('gpt-4o')
    expect(explore.models[1].voteCount).toBe(1)
    expect(explore.models[1].rank).toBe(2)
  })

  it('filters by provider', async () => {
    const { getPhases } = await import('../queries')
    const phases = await getPhases(db, [1]) // OpenAI Plus only

    const explore = phases.find(p => p.slug === 'sdd-explore')!
    expect(explore.models.every(m => m.providerId === 1)).toBe(true)
  })

  it('returns empty models array for phase with no votes', async () => {
    const { getPhases } = await import('../queries')
    const phases = await getPhases(db, [3]) // nonexistent provider

    const propose = phases.find(p => p.slug === 'sdd-propose')!
    // sdd-propose has 1 vote for claude-sonnet-4 (provider 2), not provider 3
    expect(propose.models).toHaveLength(0)
  })
})

describe('getModels', () => {
  it('returns all models when no provider filter', async () => {
    const { getModels } = await import('../queries')
    const models = await getModels(db)
    expect(models).toHaveLength(5)
  })

  it('filters by provider', async () => {
    const { getModels } = await import('../queries')
    const models = await getModels(db, 1)
    expect(models).toHaveLength(2)
    expect(models.every(m => m.providerId === 1)).toBe(true)
  })
})

describe('getProviders', () => {
  it('returns all providers', async () => {
    const { getProviders } = await import('../queries')
    const providers = await getProviders(db)
    expect(providers).toHaveLength(3)
  })
})

describe('upsertVote', () => {
  it('creates a new vote and returns it', async () => {
    const { upsertVote } = await import('../queries')
    const result = await upsertVote(db, 3, 2, 4, 2) // user 3, phase 2, model 4 (claude-haiku), provider 2

    expect(result.vote).toBeDefined()
    expect(result.vote.userId).toBe(3)
    expect(result.vote.phaseId).toBe(2)
    expect(result.vote.modelId).toBe(4)
  })

  it('upserts existing vote and creates history', async () => {
    const { upsertVote } = await import('../queries')
    // user 2 already voted on phase 1 with model 3 (claude-sonnet-4), provider 2
    const result = await upsertVote(db, 2, 1, 1, 1) // change to gpt-4o, provider 1

    expect(result.vote.modelId).toBe(1)
    expect(result.vote.providerId).toBe(1)
    expect(result.history).toBeDefined()
    expect(result.history!.oldModelId).toBe(3)
    expect(result.history!.oldProviderId).toBe(2)
    expect(result.history!.newModelId).toBe(1)
    expect(result.history!.newProviderId).toBe(1)
  })
})
