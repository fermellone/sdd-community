import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getProviders } from '@/lib/queries'

export async function GET() {
  try {
    const providers = await getProviders(getDb())
    return NextResponse.json({ data: providers })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 },
    )
  }
}
