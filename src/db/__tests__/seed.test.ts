import { describe, it, expect, beforeAll } from 'vitest'

// Basic idempotency test — structure only since DB isn't wired yet
describe('seed', () => {
  it('seed function exists and is callable', async () => {
    const { seed } = await import('../seed')
    expect(typeof seed).toBe('function')
  })
})