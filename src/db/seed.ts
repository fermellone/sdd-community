import { getDb } from './index'
import { providers, phases, models } from './schema'
import { eq } from 'drizzle-orm'

const PHASE_DATA = [
  { name: 'sdd-explore', responsibility: 'Exploración', description: 'Investigación inicial, análisis del problema, exploración de soluciones posibles.', slug: 'sdd-explore' },
  { name: 'sdd-propose', responsibility: 'Propuesta', description: 'Redacción de la propuesta de cambio con intent, scope y approach.', slug: 'sdd-propose' },
  { name: 'sdd-spec', responsibility: 'Especificación', description: 'Definición de requirements y scenarios en formato Given/When/Then.', slug: 'sdd-spec' },
  { name: 'sdd-design', responsibility: 'Diseño Técnico', description: 'Decisiones de arquitectura, diagramas, contratos de interfaces.', slug: 'sdd-design' },
  { name: 'sdd-tasks', responsibility: 'Planificación de Tareas', description: 'Desglose del cambio en tasks implementables con numeración jerárquica.', slug: 'sdd-tasks' },
  { name: 'sdd-apply', responsibility: 'Implementación', description: 'Escritura del código real siguiendo specs y design. El agente más capaz aquí.', slug: 'sdd-apply' },
  { name: 'sdd-verify', responsibility: 'Verificación', description: 'Validación de que el código cumple las specs — auditoría y testing.', slug: 'sdd-verify' },
  { name: 'sdd-archive', responsibility: 'Archivo', description: 'Sincronización de delta specs a main specs y cierre del cambio.', slug: 'sdd-archive' },
  { name: 'sdd-init', responsibility: 'Inicialización', description: 'Bootstrap del contexto SDD en un proyecto nuevo.', slug: 'sdd-init' },
  { name: 'sdd-onboard', responsibility: 'Onboarding', description: 'Guía end-to-end del workflow SDD para nuevos colaboradores.', slug: 'sdd-onboard' },
]

const PROVIDER_DATA = [
  { name: 'OpenAI Plus', slug: 'openai-plus' },
  { name: 'OpenAI Pro (x5)', slug: 'openai-pro-x5' },
  { name: 'OpenAI Pro (x10)', slug: 'openai-pro-x10' },
  { name: 'Anthropic Pro', slug: 'anthropic-pro' },
  { name: 'Anthropic Max (x5)', slug: 'anthropic-max-x5' },
  { name: 'Anthropic Max (x10)', slug: 'anthropic-max-x10' },
  { name: 'OpenCode Go', slug: 'opencode-go' },
  { name: 'OpenCode Zen', slug: 'opencode-zen' },
  { name: 'OpenRouter (Free)', slug: 'openrouter-free' },
  { name: 'OpenRouter (PAYG)', slug: 'openrouter-payg' },
]

const MODEL_DATA: Record<string, string[]> = {
  // OpenAI Plus — entry-level models
  'openai-plus': [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'o3-mini',
    'o4-mini',
  ],
  // OpenAI Pro (x5) — mid-tier models
  'openai-pro-x5': [
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-5-codex',
    'gpt-5-chat',
    'o3',
    'o4-mini',
    'gpt-4o',
  ],
  // OpenAI Pro (x10) — premium models
  'openai-pro-x10': [
    'gpt-5-pro',
    'gpt-5.5',
    'gpt-5.5-pro',
    'gpt-5.4-pro',
    'gpt-5.4',
    'o1-pro',
    'o3-pro',
    'gpt-5.2-pro',
    'gpt-5-image',
  ],
  // Anthropic Pro — balanced Claude models
  'anthropic-pro': [
    'claude-sonnet-4.6',
    'claude-haiku-4.5',
    'claude-sonnet-4.5',
  ],
  // Anthropic Max (x5) — advanced Opus + Sonnet
  'anthropic-max-x5': [
    'claude-opus-4.7',
    'claude-sonnet-4.6',
    'claude-opus-4.6',
  ],
  // Anthropic Max (x10) — top-tier Opus only
  'anthropic-max-x10': [
    'claude-opus-4.8',
    'claude-opus-4.7',
    'claude-opus-4.6',
    'claude-sonnet-4.6',
  ],
  // OpenCode Go — accessible, cost-effective models
  'opencode-go': [
    'deepseek-v4-pro',
    'deepseek-chat',
    'deepseek-r1',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'qwen3-max',
    'llama-4-maverick',
    'mistral-large-2512',
  ],
  // OpenCode Zen — premium, high-capability models
  'opencode-zen': [
    'claude-opus-4.8',
    'gpt-5-pro',
    'gemini-2.5-pro',
    'deepseek-v4-pro',
    'grok-4.20',
    'qwen3.7-max',
    'claude-sonnet-4.6',
    'o3-pro',
    'mistral-large-2512',
  ],
  // OpenRouter (Free) — free-tier models
  'openrouter-free': [
    'deepseek-chat',
    'deepseek-r1',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'llama-4-maverick',
    'llama-4-scout',
    'qwen3-coder',
    'mistral-small-3.2-24b-instruct',
  ],
  // OpenRouter (PAYG) — full catalog highlights
  'openrouter-payg': [
    'claude-opus-4.8',
    'gpt-5-pro',
    'gemini-2.5-pro',
    'deepseek-v4-pro',
    'grok-4.20',
    'llama-4-maverick',
    'qwen3.7-max',
    'mistral-large-2512',
    'claude-sonnet-4.6',
    'gpt-5',
    'o3',
    'deepseek-chat',
  ],
}

export async function seed() {
  // Seed providers (idempotent)
  for (const p of PROVIDER_DATA) {
    const existing = await getDb().select().from(providers).where(eq(providers.slug, p.slug)).limit(1)
    if (existing.length === 0) {
      await getDb().insert(providers).values(p)
    }
  }

  // Seed phases (idempotent)
  for (const ph of PHASE_DATA) {
    const existing = await getDb().select().from(phases).where(eq(phases.slug, ph.slug)).limit(1)
    if (existing.length === 0) {
      await getDb().insert(phases).values(ph)
    }
  }

  // Seed models (idempotent)
  const allProviders = await getDb().select().from(providers)
  for (const [slug, modelNames] of Object.entries(MODEL_DATA)) {
    const provider = allProviders.find((p) => p.slug === slug)
    if (!provider) continue
    for (const name of modelNames) {
      const existing = await getDb().select().from(models).where(eq(models.name, name)).limit(1)
      if (existing.length === 0) {
        await getDb().insert(models).values({ name, providerId: provider.id })
      }
    }
  }
}