import { create } from 'zustand';
import type { Invoice } from '../types';
import { supabase } from '../services/supabase';

// DB→アプリ型変換
const fromDb = (row: Record<string, unknown>): Invoice => ({
  id: row.id as string,
  customerId: row.customer_id as string,
  projectId: row.project_id as string | undefined,
  invoiceNumber: row.invoice_number as string,
  estimateAmount: row.estimate_amount as number | undefined,
  amount: row.amount as number,
  tax: row.tax as number | undefined,
  issueDate: row.issue_date as string,
  dueDate: row.due_date as string | undefined,
  paidDate: row.paid_date as string | undefined,
  status: row.status as Invoice['status'],
  memo: row.memo as string | undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// アプリ→DB型変換
const toDb = (invoice: Partial<Invoice>) => ({
  ...(invoice.customerId !== undefined && { customer_id: invoice.customerId }),
  ...(invoice.projectId !== undefined && { project_id: invoice.projectId || null }),
  ...(invoice.invoiceNumber !== undefined && { invoice_number: invoice.invoiceNumber }),
  ...(invoice.estimateAmount !== undefined && { estimate_amount: invoice.estimateAmount || null }),
  ...(invoice.amount !== undefined && { amount: invoice.amount }),
  ...(invoice.tax !== undefined && { tax: invoice.tax || null }),
  ...(invoice.issueDate !== undefined && { issue_date: invoice.issueDate }),
  ...(invoice.dueDate !== undefined && { due_date: invoice.dueDate || null }),
  ...(invoice.paidDate !== undefined && { paid_date: invoice.paidDate || null }),
  ...(invoice.status !== undefined && { status: invoice.status }),
  ...(invoice.memo !== undefined && { memo: invoice.memo || null }),
});

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;

  loadInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  selectInvoice: (id: string | null) => void;
  getInvoicesByCustomer: (customerId: string) => Invoice[];
  getInvoicesByProject: (projectId: string) => Invoice[];
  generateInvoiceNumber: () => string;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  selectedInvoice: null,
  isLoading: false,

  loadInvoices: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load invoices:', error);
      set({ isLoading: false });
      return;
    }

    const invoices = (data || []).map(fromDb);
    set({ invoices, isLoading: false });
  },

  addInvoice: async (invoiceData) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert(toDb(invoiceData as Partial<Invoice>))
      .select()
      .single();

    if (error) {
      console.error('Failed to add invoice:', error);
      throw error;
    }

    const invoice = fromDb(data);
    set({ invoices: [invoice, ...get().invoices] });
    return invoice;
  },

  updateInvoice: async (id, updates) => {
    const { data, error } = await supabase
      .from('invoices')
      .update({ ...toDb(updates), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update invoice:', error);
      return;
    }

    const updated = fromDb(data);
    set({
      invoices: get().invoices.map(i => (i.id === id ? updated : i)),
      selectedInvoice: get().selectedInvoice?.id === id ? updated : get().selectedInvoice,
    });
  },

  deleteInvoice: async (id) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete invoice:', error);
      return;
    }

    set({
      invoices: get().invoices.filter(i => i.id !== id),
      selectedInvoice: get().selectedInvoice?.id === id ? null : get().selectedInvoice,
    });
  },

  selectInvoice: (id) => {
    if (id === null) {
      set({ selectedInvoice: null });
    } else {
      const invoice = get().invoices.find(i => i.id === id) || null;
      set({ selectedInvoice: invoice });
    }
  },

  getInvoicesByCustomer: (customerId) => {
    return get().invoices.filter(i => i.customerId === customerId);
  },

  getInvoicesByProject: (projectId) => {
    return get().invoices.filter(i => i.projectId === projectId);
  },

  generateInvoiceNumber: () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = get().invoices.filter(i => {
      const issueDate = new Date(i.issueDate);
      return issueDate.getFullYear() === year && issueDate.getMonth() === now.getMonth();
    }).length + 1;
    return `INV-${year}${month}-${String(count).padStart(3, '0')}`;
  },
}));
