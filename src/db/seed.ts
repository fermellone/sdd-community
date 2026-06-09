import { db } from './index'
import { providers, phases, models } from './schema'
import { eq, sql } from 'drizzle-orm'

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
  'openai-plus': ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini'],
  'openai-pro-x5': ['gpt-4o', 'o1', 'o3-mini'],
  'openai-pro-x10': ['gpt-4o', 'o1-pro', 'o3'],
  'anthropic-pro': ['claude-sonnet-4', 'claude-haiku-3.5'],
  'anthropic-max-x5': ['claude-sonnet-4', 'claude-opus-4'],
  'anthropic-max-x10': ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku-3.5'],
  'opencode-go': ['deepseek-v4', 'deepseek-v4-pro'],
  'opencode-zen': ['deepseek-v4', 'deepseek-v4-pro', 'gemini-2.5-pro'],
  'openrouter-free': ['gemini-2.5-flash', 'deepseek-chat', 'llama-4-maverick'],
  'openrouter-payg': ['claude-sonnet-4', 'gpt-4o', 'gemini-2.5-pro', 'deepseek-chat', 'llama-4-maverick', 'qwen3-max'],
}

export async function seed() {
  // Seed providers (idempotent)
  for (const p of PROVIDER_DATA) {
    const existing = await db.select().from(providers).where(eq(providers.slug, p.slug)).limit(1)
    if (existing.length === 0) {
      await db.insert(providers).values(p)
    }
  }

  // Seed phases (idempotent)
  for (const ph of PHASE_DATA) {
    const existing = await db.select().from(phases).where(eq(phases.slug, ph.slug)).limit(1)
    if (existing.length === 0) {
      await db.insert(phases).values(ph)
    }
  }

  // Seed models (idempotent)
  const allProviders = await db.select().from(providers)
  for (const [slug, modelNames] of Object.entries(MODEL_DATA)) {
    const provider = allProviders.find((p) => p.slug === slug)
    if (!provider) continue
    for (const name of modelNames) {
      const existing = await db.select().from(models).where(eq(models.name, name)).limit(1)
      if (existing.length === 0) {
        await db.insert(models).values({ name, providerId: provider.id })
      }
    }
  }
}