'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProviderResult } from '@/lib/types'

interface ProviderFilterProps {
  providers: ProviderResult[]
  value: string
  onChange: (providerId: string | null) => void
}

export function ProviderFilter({ providers, value, onChange }: ProviderFilterProps) {
  return (
    <div className="w-full max-w-xs">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por proveedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {providers.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
