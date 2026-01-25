import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create a service role client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/webhooks/quotation - Receive events from Quotation Tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Missing event or data' },
        { status: 400 }
      )
    }

    console.log(`Received quotation webhook: ${event}`, data)

    switch (event) {
      case 'quotation.created':
        // Update lead status to 'quoted' if not already
        if (data.crm_lead_id) {
          const { data: lead, error: leadError } = await supabase
            .from('crm_leads')
            .select('status')
            .eq('id', data.crm_lead_id)
            .single()

          if (!leadError && lead && !['quoted', 'negotiating', 'won', 'lost'].includes(lead.status)) {
            await supabase
              .from('crm_leads')
              .update({ status: 'quoted' })
              .eq('id', data.crm_lead_id)
          }

          // Create activity
          await supabase.from('crm_activities').insert({
            lead_id: data.crm_lead_id,
            type: 'quotation_created',
            title: `Quotation #${data.quotation_number} created`,
            description: `Amount: $${data.total_amount?.toLocaleString() || 0}`,
            metadata: { quotation_id: data.id, quotation_number: data.quotation_number },
          })
        }
        break

      case 'quotation.sent':
        if (data.crm_lead_id) {
          await supabase.from('crm_activities').insert({
            lead_id: data.crm_lead_id,
            type: 'quotation_sent',
            title: `Quotation #${data.quotation_number} sent`,
            description: 'Quotation was sent to the patient',
            metadata: { quotation_id: data.id },
          })
        }
        break

      case 'quotation.accepted':
        if (data.crm_lead_id) {
          // Update lead status to 'won'
          await supabase
            .from('crm_leads')
            .update({ status: 'won' })
            .eq('id', data.crm_lead_id)

          await supabase.from('crm_activities').insert({
            lead_id: data.crm_lead_id,
            type: 'quotation_accepted',
            title: `Quotation #${data.quotation_number} accepted`,
            description: `Deal closed! Amount: $${data.total_amount?.toLocaleString() || 0}`,
            metadata: { quotation_id: data.id },
          })
        }
        break

      case 'quotation.rejected':
        if (data.crm_lead_id) {
          // Update lead status to 'lost'
          await supabase
            .from('crm_leads')
            .update({ status: 'lost' })
            .eq('id', data.crm_lead_id)

          await supabase.from('crm_activities').insert({
            lead_id: data.crm_lead_id,
            type: 'note',
            title: `Quotation #${data.quotation_number} rejected`,
            description: data.rejection_reason || 'Quotation was rejected by the patient',
            metadata: { quotation_id: data.id },
          })
        }
        break

      default:
        console.log(`Unknown event: ${event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing quotation webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
