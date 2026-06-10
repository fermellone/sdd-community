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

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 py-6 text-sm text-muted-foreground sm:flex-row dark:border-zinc-800">
        <p>Creado por <b>fermellone</b> para la comunidad Gentle-Programming.</p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/fermellone"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <svg
              className="size-4"
              viewBox="0 0 32 32"
              aria-hidden="true"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16 .396c-8.839 0-16 7.167-16 16 0 7.073 4.584 13.068 10.937 15.183.803.151 1.093-.344 1.093-.772 0-.38-.009-1.385-.015-2.719-4.453.964-5.391-2.151-5.391-2.151-.729-1.844-1.781-2.339-1.781-2.339-1.448-.989.115-.968.115-.968 1.604.109 2.448 1.645 2.448 1.645 1.427 2.448 3.744 1.74 4.661 1.328.14-1.031.557-1.74 1.011-2.135-3.552-.401-7.287-1.776-7.287-7.907 0-1.751.62-3.177 1.645-4.297-.177-.401-.719-2.031.141-4.235 0 0 1.339-.427 4.4 1.641a15.4 15.4 0 0 1 4-.541c1.36.009 2.719.187 4 .541 3.043-2.068 4.381-1.641 4.381-1.641.859 2.204.317 3.833.161 4.235 1.015 1.12 1.635 2.547 1.635 4.297 0 6.145-3.74 7.5-7.296 7.891.556.479 1.077 1.464 1.077 2.959 0 2.14-.02 3.864-.02 4.385 0 .416.28.916 1.104.755 6.4-2.093 10.979-8.093 10.979-15.156 0-8.833-7.161-16-16-16z" />
            </svg>
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/fernando-mellone"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <svg
              className="size-4"
              viewBox="0 0 32 32"
              aria-hidden="true"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M27.26 27.271h-4.733v-7.427c0-1.771-.037-4.047-2.475-4.047-2.468 0-2.844 1.921-2.844 3.916v7.557h-4.739V11.999h4.552v2.083h.061c.636-1.203 2.183-2.468 4.491-2.468 4.801 0 5.692 3.161 5.692 7.271v8.385zM7.115 9.912a2.75 2.75 0 0 1-2.751-2.756 2.753 2.753 0 1 1 2.751 2.756m2.374 17.359H4.74V12h4.749zM29.636 0H2.36C1.057 0 0 1.031 0 2.307v27.387c0 1.276 1.057 2.307 2.36 2.307h27.271c1.301 0 2.369-1.031 2.369-2.307V2.307C32 1.031 30.932 0 29.631 0z" />
            </svg>
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  )
}
