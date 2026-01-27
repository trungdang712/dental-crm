import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role for webhook handlers
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface LeadCreatedEvent {
  type: 'lead.created'
  source: 'chat'
  timestamp: string
  payload: {
    conversationId: string
    channelType: string
    customerName: string
    customerPhone: string
    customerEmail?: string
    treatmentInterest?: string
    notes?: string
    chatbotCollectedData?: {
      dentalSituation?: string
      budget?: string
      timeline?: string
    }
  }
}

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('X-Webhook-Secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    console.error('Invalid webhook secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const event: LeadCreatedEvent = await request.json()

    // Validate event type
    if (event.type !== 'lead.created' || event.source !== 'chat') {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const { payload } = event

    // Parse name into first/last
    const nameParts = payload.customerName.trim().split(' ')
    const firstName = nameParts[0] || 'Unknown'
    const lastName = nameParts.slice(1).join(' ') || ''

    // Check if lead already exists by phone
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', payload.customerPhone)
      .single()

    if (existingLead) {
      // Update existing lead with new chat info
      await supabase
        .from('leads')
        .update({
          chat_channel: payload.channelType,
          chat_conversation_id: payload.conversationId,
          last_chat_time: event.timestamp,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id)

      // Create activity for the update
      await supabase.from('lead_activities').insert({
        lead_id: existingLead.id,
        type: 'note',
        title: 'Chat conversation updated',
        description: `New conversation via ${payload.channelType}. ${
          payload.treatmentInterest ? `Interest: ${payload.treatmentInterest}` : ''
        }`,
        metadata: {
          source: 'chat-webhook',
          chatbotData: payload.chatbotCollectedData,
        },
      })

      console.log(`Lead updated from chat: ${existingLead.id}`)

      return NextResponse.json({
        success: true,
        leadId: existingLead.id,
        action: 'updated',
      })
    }

    // Create new lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone: payload.customerPhone,
        email: payload.customerEmail,
        source: 'chat',
        source_detail: payload.channelType,
        chat_channel: payload.channelType,
        chat_conversation_id: payload.conversationId,
        interest: payload.treatmentInterest,
        notes: payload.notes,
        status: 'new',
        priority: 'warm',
      })
      .select('id')
      .single()

    if (leadError) {
      console.error('Failed to create lead:', leadError)
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    // Create initial activity
    const chatbotSummary = payload.chatbotCollectedData
      ? `\n\nChatbot collected:\n- Dental situation: ${payload.chatbotCollectedData.dentalSituation || 'N/A'}\n- Budget: ${payload.chatbotCollectedData.budget || 'N/A'}\n- Timeline: ${payload.chatbotCollectedData.timeline || 'N/A'}`
      : ''

    await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      type: 'note',
      title: 'Lead created from Chat',
      description: `Customer initiated conversation via ${payload.channelType}.${
        payload.treatmentInterest ? `\n\nInterested in: ${payload.treatmentInterest}` : ''
      }${chatbotSummary}`,
      metadata: {
        source: 'chat-webhook',
        conversationId: payload.conversationId,
        chatbotData: payload.chatbotCollectedData,
      },
    })

    console.log(`Lead created from chat: ${lead.id}`)

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      action: 'created',
    })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'chat-lead webhook',
    method: 'POST required',
  })
}
