import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProviderFilter } from '../provider-filter'

const mockProviders = [
  { id: 1, name: 'OpenAI Plus', slug: 'openai-plus' },
  { id: 2, name: 'Anthropic Pro', slug: 'anthropic-pro' },
]

describe('ProviderFilter', () => {
  it('renders "Todos" when no providers selected', () => {
    render(<ProviderFilter providers={mockProviders} selectedIds={[]} onChange={() => {}} />)
    const button = screen.getByRole('button', { name: 'Filtrar por provider' })
    expect(button).toBeDefined()
    expect(button.textContent).toContain('Todos')
  })

  it('renders provider name when single provider selected', () => {
    render(<ProviderFilter providers={mockProviders} selectedIds={['1']} onChange={() => {}} />)
    const button = screen.getByRole('button', { name: 'Filtrar por provider' })
    expect(button).toBeDefined()
    expect(button.textContent).toContain('OpenAI Plus')
  })

  it('renders count when multiple providers selected', () => {
    render(<ProviderFilter providers={mockProviders} selectedIds={['1', '2']} onChange={() => {}} />)
    const button = screen.getByRole('button', { name: 'Filtrar por provider' })
    expect(button).toBeDefined()
    expect(button.textContent).toContain('2 seleccionados')
  })

  it('renders visible tooltip content target with Spanish copy', () => {
    render(<ProviderFilter providers={mockProviders} selectedIds={[]} onChange={() => {}} />)
    const infoButton = screen.getByRole('button', { name: 'Información sobre el filtro de providers' })
    const tooltip = screen.getByRole('tooltip')

    expect(infoButton).toHaveAttribute('aria-describedby', tooltip.id)
    expect(tooltip.textContent).toBe(
      'Podés filtrar los resultados por uno o más providers a los que estás suscripto.',
    )
  })
})
