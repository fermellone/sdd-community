import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getModels } from '@/lib/queries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const providerId = searchParams.get('provider')

  try {
    const models = await getModels(getDb(), providerId ? parseInt(providerId) : undefined)
    return NextResponse.json({ data: models })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 },
    )
  }
}
