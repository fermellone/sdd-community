import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/db'
import { upsertVote } from '@/lib/queries'
import { requireUser, validateModelProvider, syncUser } from '@/lib/auth'
import { votePayloadSchema } from '@/lib/types'

export async function POST(request: Request) {
  // Auth check
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate
  const parsed = votePayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { phaseId, modelId, providerId } = parsed.data

  // Validate model-provider pair
  const isValid = await validateModelProvider(getDb(), modelId, providerId)
  if (!isValid) {
    return NextResponse.json(
      { error: 'Model does not belong to the specified provider' },
      { status: 400 },
    )
  }

  // Sync user
  const user = await syncUser(auth.userId)

  try {
    const result = await upsertVote(getDb(), user.id, phaseId, modelId, providerId)

    revalidatePath('/')

    return NextResponse.json(
      { data: { vote: result.vote, changed: !!result.history } },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to cast vote' },
      { status: 500 },
    )
  }
}
