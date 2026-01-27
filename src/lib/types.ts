// CRM Types

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'negotiating' | 'won' | 'lost';
export type LeadPriority = 'hot' | 'warm' | 'cold';
export type LeadSource = 'facebook' | 'google' | 'referral' | 'walkin' | 'website' | 'chat';
export type ChatChannel = 'zalo' | 'whatsapp' | 'messenger' | 'phone';
export type Gender = 'male' | 'female' | 'other';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'status_change';

// Image types - matching quotation-tool structure
export type PatientPhotoType = 'front_smile' | 'right_bite' | 'left_bite' | 'upper_occlusal' | 'lower_occlusal';
export type XrayType = 'opg' | 'cephalometric' | 'periapical' | 'cbct' | 'bitewing';

export interface PatientPhoto {
  type: PatientPhotoType;
  url: string;
  uploadedAt?: string;
}

export interface XrayPhoto {
  type: XrayType;
  url: string;
  uploadedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
}

export interface Lead {
  id: string;

  // Contact Info
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: string;
  country?: string;

  // Lead Info
  source?: LeadSource;
  source_detail?: string;
  interest?: string;
  estimated_value?: number;
  priority: LeadPriority;
  status: LeadStatus;

  // Chat Integration
  chat_channel?: ChatChannel;
  chat_conversation_id?: string;
  last_chat_message?: string;
  last_chat_time?: string;

  // Assignment
  assigned_to?: string;
  assigned_user?: User;

  // Follow-up
  next_follow_up?: string;
  last_contact?: string;

  // Notes
  notes?: string;

  // Images
  patient_photos?: PatientPhoto[];
  xray_photos?: XrayPhoto[];

  // Timestamps
  created_at: string;
  updated_at: string;
  status_updated_at?: string;

  // Creator
  created_by?: string;
  creator?: User;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: ActivityType;
  title: string;
  description?: string;
  created_by?: string;
  creator?: User;
  created_at: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  crm_lead_id?: string;
  patient_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  service_id: string;
  service_name?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  subtotal: number;
  service?: {
    id: string;
    name: string;
  };
}

// Form types
export interface CreateLeadData {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: string;
  country?: string;
  source?: LeadSource;
  source_detail?: string;
  interest?: string;
  estimated_value?: number;
  priority?: LeadPriority;
  notes?: string;
  assigned_to?: string;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {
  status?: LeadStatus;
  next_follow_up?: string;
}

export interface CreateActivityData {
  type: ActivityType;
  title: string;
  description?: string;
}

// Dashboard types
export interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsThisWeek: number;
  leadsWonThisMonth: number;
  conversionRate: number;
  totalPipelineValue: number;
  followUpsToday: number;
}

export interface PipelineColumn {
  status: LeadStatus;
  label: string;
  leads: Lead[];
  count: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface LeadFilters {
  status?: LeadStatus[];
  priority?: LeadPriority[];
  source?: LeadSource[];
  assigned_to?: string;
  search?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}
