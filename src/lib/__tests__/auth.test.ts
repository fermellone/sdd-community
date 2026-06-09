import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// Mock @clerk/nextjs/server
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

describe('requireUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns userId when authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'user_001',
    })

    const { requireUser } = await import('../auth')
    const result = await requireUser()

    expect(result).toEqual({ userId: 'user_001' })
  })

  it('throws 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: null,
    })

    const { requireUser } = await import('../auth')
    const result = await requireUser()

    expect(result).toBeInstanceOf(NextResponse)
    expect((result as NextResponse).status).toBe(401)
  })

  it('throws 401 when auth throws', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Clerk error'))

    const { requireUser } = await import('../auth')
    const result = await requireUser()

    expect(result).toBeInstanceOf(NextResponse)
    expect((result as NextResponse).status).toBe(401)
  })
})

describe('validateModelProvider', () => {
  it('returns true for valid model-provider pair', async () => {
    // Mock db
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: 1 }]),
    }

    const { validateModelProvider } = await import('../auth')
    const result = await validateModelProvider(mockDb as any, 1, 1)
    expect(result).toBe(true)
  })

  it('returns false for invalid pair', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    }

    const { validateModelProvider } = await import('../auth')
    const result = await validateModelProvider(mockDb as any, 999, 999)
    expect(result).toBe(false)
  })
})
