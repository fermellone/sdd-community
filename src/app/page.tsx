import { PhaseGrid } from "@/components/phase-grid"
import type { PhaseWithRankings, ProviderResult, ModelResult } from "@/lib/types"

interface HomeProps {
  searchParams: Promise<{ provider?: string }>
}

async function fetchPhases(provider?: string): Promise<PhaseWithRankings[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const url = provider
      ? `${baseUrl}/api/phases?provider=${provider}`
      : `${baseUrl}/api/phases`
    const res = await fetch(url, { cache: "no-store" })
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}

async function fetchProviders(): Promise<ProviderResult[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/providers`, { cache: "no-store" })
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}

async function fetchModels(): Promise<ModelResult[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/models`, { cache: "no-store" })
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const providerParam = params.provider || ''
  const selectedProviderIds = providerParam ? providerParam.split(',') : []

  const [phases, providers, models] = await Promise.all([
    fetchPhases(providerParam || undefined),
    fetchProviders(),
    fetchModels(),
  ])

  return (
    <PhaseGrid
      initialPhases={phases}
      providers={providers}
      models={models}
      selectedProviderIds={selectedProviderIds}
    />
  )
}
