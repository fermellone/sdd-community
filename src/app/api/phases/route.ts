import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getPhases } from '@/lib/queries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const providerId = searchParams.get('provider')

  try {
    const phases = await getPhases(getDb(), providerId ? parseInt(providerId) : undefined)
    return NextResponse.json({ data: phases })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch phases' },
      { status: 500 },
    )
  }
}
