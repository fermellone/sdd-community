'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUser, SignInButton } from '@clerk/nextjs'
import type { PhaseWithRankings } from '@/lib/types'

interface PhaseCardProps {
  phase: PhaseWithRankings
  providerFilter?: string
  onVoteClick?: (phase: PhaseWithRankings) => void
}

export function PhaseCard({ phase, onVoteClick }: PhaseCardProps) {
  const { isSignedIn } = useUser()
  const main = phase.models[0]
  const fallback = phase.models[1]

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg font-mono">{phase.name}</CardTitle>
        <CardDescription className="text-sm font-medium text-muted-foreground">
          {phase.responsibility}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{phase.description}</p>

        {main ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border p-2">
              <div>
                <p className="text-sm font-semibold">{main.modelName}</p>
                <p className="text-xs text-muted-foreground">{main.providerName}</p>
              </div>
              <Badge variant="secondary">{main.voteCount} votos</Badge>
            </div>

            {fallback && fallback.modelId !== main.modelId ? (
              <div className="flex items-center justify-between rounded-md border p-2 opacity-70">
                <div>
                  <p className="text-sm">{fallback.modelName}</p>
                  <p className="text-xs text-muted-foreground">{fallback.providerName}</p>
                </div>
                <Badge variant="outline">{fallback.voteCount} votos</Badge>
              </div>
            ) : fallback && fallback.modelId === main.modelId ? (
              <p className="text-xs text-muted-foreground text-center">
                Empate — {main.voteCount} votos
              </p>
            ) : null}

            {main.voters.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {main.voters.map((v) => (
                  <span key={v.userId} className="text-xs text-muted-foreground">
                    {v.userName}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sin votos aún</p>
        )}
      </CardContent>
      <CardFooter>
        {isSignedIn ? (
          <Button
            variant="default"
            className="w-full"
            onClick={() => onVoteClick?.(phase)}
          >
            Votar
          </Button>
        ) : (
          <SignInButton mode="modal">
            <Button variant="outline" className="w-full">
              Iniciar sesión para votar
            </Button>
          </SignInButton>
        )}
      </CardFooter>
    </Card>
  )
}
