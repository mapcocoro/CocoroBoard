export interface Client {
  id: string
  name: string
  category: string
  industry?: string
  contact?: {
    name?: string
    phone?: string
    fax?: string
    email?: string
    line?: string
    address?: string
  }
  referral?: string
  project?: {
    type?: string
    status?: string
    deadline?: string
    tech?: string
    url?: string
  }
  billing?: {
    amount?: number | string
    status?: string
    invoice_date?: string
    due_date?: string
  }
  drive?: {
    files?: string
    contracts?: string
  }
  code?: string
}

export interface BoardData {
  generated: string
  clients: Client[]
}
