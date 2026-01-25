import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/leads/[id]/status - Update lead status (for pipeline drag-drop)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = ['new', 'contacted', 'qualified', 'quoted', 'negotiating', 'won', 'lost']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Update status - the trigger will auto-update status_updated_at and create activity
    const { data, error } = await supabase
      .from('crm_leads')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        assigned_user:users!crm_leads_assigned_to_fkey(id, name, email, avatar_url),
        creator:users!crm_leads_created_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      console.error('Error updating lead status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PATCH /api/leads/[id]/status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
