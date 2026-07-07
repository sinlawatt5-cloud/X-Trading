import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ─── Validation schema ──────────────────────────────────────────────────────

const patchEntrySchema = z.object({
  notes: z.string().optional().nullable(),
  exit: z.number().positive().optional(),
  pips: z.number().optional(),
  pnl: z.number().optional(),
  screenshot: z.string().optional().nullable(),
})

// ─── GET single ─────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: { signal: true },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Failed to fetch journal entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch journal entry' },
      { status: 500 }
    )
  }
}

// ─── PATCH ──────────────────────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: unknown = await request.json()
    const parsed = patchEntrySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Build update object with only defined fields
    const updateData: Record<string, unknown> = {}
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.exit !== undefined) updateData.exit = data.exit
    if (data.pips !== undefined) updateData.pips = data.pips
    if (data.pnl !== undefined) updateData.pnl = data.pnl
    if (data.screenshot !== undefined) updateData.screenshot = data.screenshot

    const entry = await prisma.journalEntry.update({
      where: { id },
      data: updateData,
      include: { signal: true },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Failed to update journal entry:', error)
    return NextResponse.json(
      { error: 'Failed to update journal entry' },
      { status: 500 }
    )
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.journalEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete journal entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete journal entry' },
      { status: 500 }
    )
  }
}
