import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const QUOTATION_TOOL_API_KEY = process.env.QUOTATION_TOOL_API_KEY

/**
 * Verify API key from quotation tool
 */
function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  const token = authHeader.substring(7)
  return token === QUOTATION_TOOL_API_KEY
}

/**
 * GET /api/leads/[id]/public
 * Public endpoint for quotation tool to fetch lead data including images
 * Requires API key authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API key
    if (!verifyApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('crm_leads')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        email,
        country,
        interest,
        patient_photos,
        xray_photos
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      console.error('Error fetching lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return lead data formatted for quotation tool
    return NextResponse.json({
      crm_lead_id: data.id,
      patient_name: `${data.first_name} ${data.last_name}`.trim(),
      patient_phone: data.phone,
      patient_email: data.email || '',
      patient_country: data.country || 'VN',
      interest: data.interest,
      patient_photos: data.patient_photos || [],
      xray_photos: data.xray_photos || [],
    })
  } catch (error) {
    console.error('Error in GET /api/leads/[id]/public:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
