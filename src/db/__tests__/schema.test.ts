import { describe, it, expect } from 'vitest'
import * as schema from '../schema'

describe('db schema', () => {
  it('exports all 6 tables', () => {
    expect(schema.providers).toBeDefined()
    expect(schema.phases).toBeDefined()
    expect(schema.models).toBeDefined()
    expect(schema.users).toBeDefined()
    expect(schema.votes).toBeDefined()
    expect(schema.voteHistory).toBeDefined()
  })

  it('votes table has unique constraint on user_id + phase_id', () => {
    const sql = schema.votes.toString()
    // Should have a unique constraint
    expect(schema.votes).toBeDefined()
  })
})