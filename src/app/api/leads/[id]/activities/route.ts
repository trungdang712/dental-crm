import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/leads/[id]/activities - Get activities for a lead
export async function GET(
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

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data, error } = await supabase
      .from('crm_activities')
      .select(`
        *,
        creator:users!crm_activities_created_by_fkey(id, name, email)
      `)
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/leads/[id]/activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leads/[id]/activities - Create a new activity
export async function POST(
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

    // Validate required fields
    if (!body.type || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title' },
        { status: 400 }
      )
    }

    // Validate activity type
    const validTypes = ['call', 'email', 'meeting', 'note', 'status_change', 'quotation_created', 'quotation_sent', 'quotation_accepted']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if lead exists
    const { data: lead, error: leadError } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Create activity
    const { data, error } = await supabase
      .from('crm_activities')
      .insert({
        lead_id: id,
        type: body.type,
        title: body.title,
        description: body.description,
        metadata: body.metadata || {},
        created_by: user.id
      })
      .select(`
        *,
        creator:users!crm_activities_created_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update lead's last_contact if activity is call, email, or meeting
    if (['call', 'email', 'meeting'].includes(body.type)) {
      await supabase
        .from('crm_leads')
        .update({ last_contact: new Date().toISOString() })
        .eq('id', id)
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/leads/[id]/activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
