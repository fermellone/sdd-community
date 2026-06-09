import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getPhases } from '@/lib/queries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const providerParam = searchParams.get('provider')
  const providerIds = providerParam
    ? providerParam.split(',').map(Number).filter((n) => !isNaN(n))
    : []

  try {
    const phases = await getPhases(getDb(), providerIds.length > 0 ? providerIds : undefined)
    return NextResponse.json({ data: phases })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch phases' },
      { status: 500 },
    )
  }
}
