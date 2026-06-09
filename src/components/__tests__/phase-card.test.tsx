import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhaseCard } from '../phase-card'
import type { PhaseWithRankings } from '@/lib/types'

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockPhase: PhaseWithRankings = {
  id: 1,
  name: 'sdd-explore',
  responsibility: 'Exploración',
  description: 'Investigación inicial',
  slug: 'sdd-explore',
  models: [
    {
      modelId: 1,
      modelName: 'claude-sonnet-4',
      providerId: 2,
      providerName: 'Anthropic Pro',
      providerSlug: 'anthropic-pro',
      voteCount: 5,
      rank: 1,
      voters: [
        { userId: 1, userName: 'Fer', userAvatarUrl: null },
        { userId: 2, userName: 'Ana', userAvatarUrl: null },
      ],
    },
    {
      modelId: 2,
      modelName: 'gpt-4o',
      providerId: 1,
      providerName: 'OpenAI Plus',
      providerSlug: 'openai-plus',
      voteCount: 3,
      rank: 2,
      voters: [],
    },
  ],
}

describe('PhaseCard', () => {
  it('renders phase name and description', async () => {
    const { useUser } = await import('@clerk/nextjs')
    ;(useUser as ReturnType<typeof vi.fn>).mockReturnValue({ isSignedIn: false })

    render(<PhaseCard phase={mockPhase} />)

    expect(screen.getByText('sdd-explore')).toBeDefined()
    expect(screen.getByText('Exploración')).toBeDefined()
    expect(screen.getByText('Investigación inicial')).toBeDefined()
  })

  it('shows main model with vote count', async () => {
    const { useUser } = await import('@clerk/nextjs')
    ;(useUser as ReturnType<typeof vi.fn>).mockReturnValue({ isSignedIn: false })

    render(<PhaseCard phase={mockPhase} />)

    expect(screen.getByText('claude-sonnet-4')).toBeDefined()
    expect(screen.getByText('5 votos')).toBeDefined()
  })

  it('shows fallback model', async () => {
    const { useUser } = await import('@clerk/nextjs')
    ;(useUser as ReturnType<typeof vi.fn>).mockReturnValue({ isSignedIn: false })

    render(<PhaseCard phase={mockPhase} />)

    expect(screen.getByText('gpt-4o')).toBeDefined()
    expect(screen.getByText('3 votos')).toBeDefined()
  })

  it('shows sign in button when not signed in', async () => {
    const { useUser } = await import('@clerk/nextjs')
    ;(useUser as ReturnType<typeof vi.fn>).mockReturnValue({ isSignedIn: false })

    render(<PhaseCard phase={mockPhase} />)

    expect(screen.getByText('Iniciar sesión para votar')).toBeDefined()
  })

  it('shows Votar button when signed in', async () => {
    const { useUser } = await import('@clerk/nextjs')
    ;(useUser as ReturnType<typeof vi.fn>).mockReturnValue({ isSignedIn: true })

    render(<PhaseCard phase={mockPhase} />)

    expect(screen.getByText('Votar')).toBeDefined()
  })

  it('shows Cambiar voto button when signed in user already voted', async () => {
    const { useUser } = await import('@clerk/nextjs')
    ;(useUser as ReturnType<typeof vi.fn>).mockReturnValue({ isSignedIn: true })

    render(
      <PhaseCard
        phase={{
          ...mockPhase,
          currentUserVote: {
            modelId: 1,
            modelName: 'claude-sonnet-4',
            providerId: 2,
            providerName: 'Anthropic Pro',
            providerSlug: 'anthropic-pro',
          },
        }}
      />,
    )

    expect(screen.getByText('Cambiar voto')).toBeDefined()
  })

  it('calls onVoteClick when Votar is clicked', async () => {
    const { useUser } = await import('@clerk/nextjs')
    ;(useUser as ReturnType<typeof vi.fn>).mockReturnValue({ isSignedIn: true })
    const onVoteClick = vi.fn()

    render(<PhaseCard phase={mockPhase} onVoteClick={onVoteClick} />)
    fireEvent.click(screen.getByText('Votar'))

    expect(onVoteClick).toHaveBeenCalledWith(mockPhase)
  })

  it('shows "Sin votos aún" when no models', async () => {
    const { useUser } = await import('@clerk/nextjs')
    ;(useUser as ReturnType<typeof vi.fn>).mockReturnValue({ isSignedIn: false })

    const emptyPhase = { ...mockPhase, models: [] }
    render(<PhaseCard phase={emptyPhase} />)

    expect(screen.getByText('Sin votos aún')).toBeDefined()
  })

  it('shows voter names', async () => {
    const { useUser } = await import('@clerk/nextjs')
    ;(useUser as ReturnType<typeof vi.fn>).mockReturnValue({ isSignedIn: false })

    render(<PhaseCard phase={mockPhase} />)

    expect(screen.getByText('Fer')).toBeDefined()
    expect(screen.getByText('Ana')).toBeDefined()
  })
})
