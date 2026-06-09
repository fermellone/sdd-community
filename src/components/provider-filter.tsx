'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, InfoIcon } from 'lucide-react'
import type { ProviderResult } from '@/lib/types'

const PROVIDER_FILTER_TOOLTIP_ID = 'provider-filter-tooltip'
const PROVIDER_FILTER_TOOLTIP = 'Podés filtrar los resultados por uno o más providers a los que estás suscripto.'

interface ProviderFilterProps {
  providers: ProviderResult[]
  selectedIds: string[]
  onChange: (providerIds: string[]) => void
}

export function ProviderFilter({ providers, selectedIds, onChange }: ProviderFilterProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  function toggleProvider(id: string) {
    const current = selectedIds.includes(id)
    if (current) {
      const next = selectedIds.filter((s) => s !== id)
      onChange(next)
    } else {
      onChange([...selectedIds, id])
    }
  }

  const displayText =
    selectedIds.length === 0
      ? 'Todos'
      : selectedIds.length === 1
        ? providers.find((p) => String(p.id) === selectedIds[0])?.name ?? '1 seleccionado'
        : `${selectedIds.length} seleccionados`

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-8"
          aria-label="Filtrar por provider"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="line-clamp-1 text-left">{displayText}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground shrink-0" />
        </button>
        <div className="relative group shrink-0">
          <button
            type="button"
            aria-label="Información sobre el filtro de providers"
            aria-describedby={PROVIDER_FILTER_TOOLTIP_ID}
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <InfoIcon className="size-4" />
          </button>
          <div
            id={PROVIDER_FILTER_TOOLTIP_ID}
            role="tooltip"
            className="pointer-events-none invisible absolute right-0 top-full z-50 mt-2 w-72 rounded-md border bg-card px-3 py-2 text-xs text-foreground opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          >
            {PROVIDER_FILTER_TOOLTIP}
          </div>
        </div>
      </div>
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 w-full rounded-lg border bg-card text-foreground shadow-md"
        >
          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent rounded-t-lg">
            <input
              type="checkbox"
              checked={selectedIds.length === 0}
              onChange={() => onChange([])}
              className="size-4 rounded border-input accent-primary"
            />
            <span className="text-sm">Todos</span>
          </label>
          <div className="h-px bg-border mx-2" />
          {providers.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent last:rounded-b-lg"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(String(p.id))}
                onChange={() => toggleProvider(String(p.id))}
                className="size-4 rounded border-input accent-primary"
              />
              <span className="text-sm">{p.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
