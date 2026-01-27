import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const QUOTATION_TOOL_URL = process.env.NEXT_PUBLIC_QUOTATION_TOOL_URL || 'https://baogia.greenfield.clinic'
const QUOTATION_API_KEY = process.env.QUOTATION_API_KEY

/**
 * GET /api/quotation-sync
 * Fetch quotations linked to a specific CRM lead
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')

    if (!leadId) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      )
    }

    // Fetch quotations from the quotation tool
    const response = await fetch(
      `${QUOTATION_TOOL_URL}/api/crm?crm_lead_id=${leadId}`,
      {
        headers: {
          'Authorization': `Bearer ${QUOTATION_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Quotation tool API error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to fetch quotations from quotation tool' },
        { status: response.status }
      )
    }

    const quotations = await response.json()
    return NextResponse.json({ data: quotations })
  } catch (error) {
    console.error('Error fetching quotations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/quotation-sync
 * Push lead data to quotation tool for sync
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { lead_id } = body

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      )
    }

    // Fetch lead data from CRM
    const { data: lead, error: leadError } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Push lead data to quotation tool
    const response = await fetch(
      `${QUOTATION_TOOL_URL}/api/crm`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QUOTATION_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crm_lead_id: lead.id,
          patient_name: `${lead.first_name} ${lead.last_name}`.trim(),
          phone: lead.phone,
          email: lead.email,
          interest: lead.interest,
          estimated_value: lead.estimated_value,
          notes: lead.notes,
        }),
      }
    )

    if (!response.ok) {
      console.error('Quotation tool sync error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to sync with quotation tool' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json({
      success: true,
      message: 'Lead synced with quotation tool',
      data: result
    })
  } catch (error) {
    console.error('Error syncing lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
