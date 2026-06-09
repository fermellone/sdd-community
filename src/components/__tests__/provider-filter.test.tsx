import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProviderFilter } from '../provider-filter'

const mockProviders = [
  { id: 1, name: 'OpenAI Plus', slug: 'openai-plus' },
  { id: 2, name: 'Anthropic Pro', slug: 'anthropic-pro' },
]

describe('ProviderFilter', () => {
  it('renders with current value displayed', () => {
    render(<ProviderFilter providers={mockProviders} value="all" onChange={() => {}} />)
    // The select trigger displays the label, not the raw value
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeDefined()
    expect(trigger.textContent).toContain('Todos')
  })

  it('renders with provider value', () => {
    render(<ProviderFilter providers={mockProviders} value="1" onChange={() => {}} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeDefined()
    expect(trigger.textContent).toContain('OpenAI Plus')
  })
})
