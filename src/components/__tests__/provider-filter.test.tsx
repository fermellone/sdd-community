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
    // The select trigger shows the current value "all"
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeDefined()
    expect(trigger.textContent).toContain('all')
  })

  it('renders with provider value', () => {
    render(<ProviderFilter providers={mockProviders} value="1" onChange={() => {}} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeDefined()
    expect(trigger.textContent).toContain('1')
  })
})
