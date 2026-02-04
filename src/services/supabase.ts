import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mwvewkjxlvciyrumczzr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmV3a2p4bHZjaXlydW1jenpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTM2MDUsImV4cCI6MjA4NTc2OTYwNX0.9Umx0dAgu7G-IzMlFP-ZSrMTNfP8qIEuuCFPce6xSQ4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// データベースの型定義
export interface DbCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  address: string | null;
  position: string | null;
  contact_person: string | null;
  category: string | null;
  referral_source: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  project_number: string | null;
  customer_id: string;
  name: string;
  description: string | null;
  type: string;
  category: string | null;
  status: string;
  start_date: string | null;
  due_date: string | null;
  budget: number | null;
  domain_info: string | null;
  ai_consult_url: string | null;
  code_folder: string | null;
  meeting_folder: string | null;
  contract_folder: string | null;
  staging_url: string | null;
  production_url: string | null;
  activities: unknown[];
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  task_number: string | null;
  project_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInvoice {
  id: string;
  customer_id: string;
  project_id: string | null;
  invoice_number: string;
  estimate_amount: number | null;
  amount: number;
  tax: number | null;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  status: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}
