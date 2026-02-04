import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Invoice } from '../types';
import { createEntityStorage } from '../services/localStorage';

const storage = createEntityStorage<Invoice>('invoice');

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;

  // アクション
  loadInvoices: () => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  selectInvoice: (id: string | null) => void;
  getInvoicesByCustomer: (customerId: string) => Invoice[];
  getInvoicesByProject: (projectId: string) => Invoice[];
  generateInvoiceNumber: () => string;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  selectedInvoice: null,
  isLoading: false,

  loadInvoices: () => {
    set({ isLoading: true });
    const invoices = storage.getAll();
    set({ invoices, isLoading: false });
  },

  addInvoice: (invoiceData) => {
    const now = new Date().toISOString();
    const invoice: Invoice = {
      ...invoiceData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    storage.create(invoice);
    set({ invoices: [...get().invoices, invoice] });
    return invoice;
  },

  updateInvoice: (id, updates) => {
    const updated = storage.update(id, updates);
    if (updated) {
      set({
        invoices: get().invoices.map(i => (i.id === id ? updated : i)),
        selectedInvoice: get().selectedInvoice?.id === id ? updated : get().selectedInvoice,
      });
    }
  },

  deleteInvoice: (id) => {
    storage.delete(id);
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
