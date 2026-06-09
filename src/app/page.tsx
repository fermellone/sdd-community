import { auth } from '@clerk/nextjs/server'
import { PhaseGrid } from '@/components/phase-grid'
import { getDb } from '@/db'
import { getModels, getPhases, getProviders } from '@/lib/queries'

interface HomeProps {
  searchParams: Promise<{ provider?: string }>
}

function parseProviderIds(provider?: string): number[] {
  if (!provider) return []

  return provider
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const providerIds = parseProviderIds(params.provider)
  const selectedProviderIds = providerIds.map(String)
  const { userId } = await auth()

  const [phases, providers, models] = await Promise.all([
    getPhases(getDb(), providerIds.length > 0 ? providerIds : undefined, userId ?? undefined),
    getProviders(getDb()),
    getModels(getDb()),
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
