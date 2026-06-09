'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { PhaseWithRankings, ModelResult, ProviderResult } from '@/lib/types'

interface VoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phase: PhaseWithRankings | null
  providers: ProviderResult[]
  models: ModelResult[]
  onVote: (phaseId: number, modelId: number, providerId: number) => Promise<void>
}

export function VoteModal({
  open,
  onOpenChange,
  phase,
  providers,
  models,
  onVote,
}: VoteModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredModels = selectedProvider
    ? models.filter((m) => m.providerId === parseInt(selectedProvider))
    : models

  const handleSubmit = async () => {
    if (!phase || !selectedModel || !selectedProvider) return

    setSubmitting(true)
    setError(null)

    try {
      await onVote(phase.id, parseInt(selectedModel), parseInt(selectedProvider))
      onOpenChange(false)
      setSelectedProvider('')
      setSelectedModel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al votar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Votar — {phase?.name}</DialogTitle>
          <DialogDescription>
            Elegí el modelo y proveedor que consideres mejor para esta fase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Proveedor *</label>
            <Select
              value={selectedProvider}
              onValueChange={(v) => {
                setSelectedProvider(v ?? '')
                setSelectedModel('')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un proveedor" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Modelo *</label>
            <Select
              value={selectedModel}
              onValueChange={(v) => setSelectedModel(v ?? '')}
              disabled={!selectedProvider}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedProvider
                      ? 'Seleccioná un modelo'
                      : 'Primero elegí un proveedor'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredModels.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            disabled={!selectedProvider || !selectedModel || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Votando...' : 'Confirmar voto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
