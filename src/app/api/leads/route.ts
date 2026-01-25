import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/leads - List leads with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const source = searchParams.get('source')
    const assigned_to = searchParams.get('assigned_to')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    let query = supabase
      .from('crm_leads')
      .select('*', { count: 'exact' })

    // Apply filters
    if (status) {
      const statuses = status.split(',')
      query = query.in('status', statuses)
    }

    if (priority) {
      const priorities = priority.split(',')
      query = query.in('priority', priorities)
    }

    if (source) {
      const sources = source.split(',')
      query = query.in('source', sources)
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to)
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,interest.ilike.%${search}%`)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  } catch (error) {
    console.error('Error in GET /api/leads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, phone' },
        { status: 400 }
      )
    }

    // Create lead
    const { data, error } = await supabase
      .from('crm_leads')
      .insert({
        ...body,
        status: body.status || 'new',
        priority: body.priority || 'warm',
        created_by: user.id
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create initial activity
    await supabase.from('crm_activities').insert({
      lead_id: data.id,
      type: 'note',
      title: 'Lead created',
      description: `Lead created by ${user.email}`,
      created_by: user.id
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/leads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
