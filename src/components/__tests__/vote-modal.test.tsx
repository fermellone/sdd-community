import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VoteModal } from '../vote-modal'
import type { PhaseWithRankings } from '@/lib/types'

const mockPhase: PhaseWithRankings = {
  id: 1,
  name: 'sdd-explore',
  responsibility: 'Exploración',
  description: 'Test',
  slug: 'sdd-explore',
  models: [],
}

const mockProviders = [
  { id: 1, name: 'OpenAI Plus', slug: 'openai-plus' },
]

const mockModels = [
  { id: 1, name: 'gpt-4o', providerId: 1, providerName: 'OpenAI Plus', providerSlug: 'openai-plus' },
]

describe('VoteModal', () => {
  it('renders with phase name in title', () => {
    render(
      <VoteModal
        open={true}
        onOpenChange={() => {}}
        phase={mockPhase}
        providers={mockProviders}
        models={mockModels}
        onVote={async () => {}}
      />,
    )

    expect(screen.getByText('Votar — sdd-explore')).toBeDefined()
  })

  it('shows provider select', () => {
    render(
      <VoteModal
        open={true}
        onOpenChange={() => {}}
        phase={mockPhase}
        providers={mockProviders}
        models={mockModels}
        onVote={async () => {}}
      />,
    )

    expect(screen.getByText('Seleccioná un proveedor')).toBeDefined()
  })
})
