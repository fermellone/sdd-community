"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { UserButton, useUser } from "@clerk/nextjs"
import { PhaseCard } from "./phase-card"
import { VoteModal } from "./vote-modal"
import { ProviderFilter } from "./provider-filter"
import { SignInButton } from "./sign-in-button"
import type { PhaseWithRankings, ProviderResult, ModelResult } from "@/lib/types"

interface PhaseGridProps {
  initialPhases: PhaseWithRankings[]
  providers: ProviderResult[]
  models: ModelResult[]
  selectedProviderIds: string[]
}

export function PhaseGrid({
  initialPhases,
  providers,
  models,
  selectedProviderIds,
}: PhaseGridProps) {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [filter, setFilter] = useState<string[]>(selectedProviderIds)
  const [phases, setPhases] = useState(initialPhases)
  const [voteModalOpen, setVoteModalOpen] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<PhaseWithRankings | null>(null)
  const [votingError, setVotingError] = useState<string | null>(null)

  const handleFilterChange = useCallback(
    (providerIds: string[]) => {
      setFilter(providerIds)
      if (providerIds.length === 0) {
        router.push('/')
      } else {
        router.push(`/?provider=${providerIds.join(',')}`)
      }
    },
    [router],
  )

  const handleVoteClick = useCallback((phase: PhaseWithRankings) => {
    setSelectedPhase(phase)
    setVotingError(null)
    setVoteModalOpen(true)
  }, [])

  const handleVote = useCallback(
    async (phaseId: number, modelId: number, providerId: number) => {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId, modelId, providerId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al votar")
      }

      // Refresh phases
      const filterParam = filter.length > 0 ? `?provider=${filter.join(',')}` : ''
      const phasesRes = await fetch(`/api/phases${filterParam}`)
      const phasesData = await phasesRes.json()
      setPhases(phasesData.data)
    },
    [filter],
  )

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            SDD Community Rankings
          </h1>
          <p className="text-sm text-muted-foreground">
            La comunidad vota el mejor modelo para cada fase SDD
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProviderFilter
            providers={providers}
            selectedIds={filter}
            onChange={handleFilterChange}
          />
          {isSignedIn ? <UserButton /> : <SignInButton />}
        </div>
      </header>

      {/* Error */}
      {votingError && (
        <p className="text-sm text-destructive">{votingError}</p>
      )}

      {/* Phase Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {phases.map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            onVoteClick={handleVoteClick}
          />
        ))}
      </div>

      {/* Vote Modal */}
      <VoteModal
        open={voteModalOpen}
        onOpenChange={setVoteModalOpen}
        phase={selectedPhase}
        providers={providers}
        models={models}
        onVote={handleVote}
      />
    </div>
  )
}
