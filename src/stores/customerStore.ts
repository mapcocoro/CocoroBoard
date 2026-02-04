import { create } from 'zustand';
import type { Customer } from '../types';
import { supabase } from '../services/supabase';

// DB→アプリ型変換
const fromDb = (row: Record<string, unknown>): Customer => ({
  id: row.id as string,
  name: row.name as string,
  email: row.email as string | undefined,
  phone: row.phone as string | undefined,
  company: row.company as string | undefined,
  website: row.website as string | undefined,
  address: row.address as string | undefined,
  position: row.position as string | undefined,
  contactPerson: row.contact_person as string | undefined,
  category: row.category as string | undefined,
  referralSource: row.referral_source as string | undefined,
  memo: row.memo as string | undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// アプリ→DB型変換
const toDb = (customer: Partial<Customer>) => ({
  ...(customer.name !== undefined && { name: customer.name }),
  ...(customer.email !== undefined && { email: customer.email || null }),
  ...(customer.phone !== undefined && { phone: customer.phone || null }),
  ...(customer.company !== undefined && { company: customer.company || null }),
  ...(customer.website !== undefined && { website: customer.website || null }),
  ...(customer.address !== undefined && { address: customer.address || null }),
  ...(customer.position !== undefined && { position: customer.position || null }),
  ...(customer.contactPerson !== undefined && { contact_person: customer.contactPerson || null }),
  ...(customer.category !== undefined && { category: customer.category || null }),
  ...(customer.referralSource !== undefined && { referral_source: customer.referralSource || null }),
  ...(customer.memo !== undefined && { memo: customer.memo || null }),
});

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;

  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  selectCustomer: (id: string | null) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  selectedCustomer: null,
  isLoading: false,

  loadCustomers: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load customers:', error);
      set({ isLoading: false });
      return;
    }

    const customers = (data || []).map(fromDb);
    set({ customers, isLoading: false });
  },

  addCustomer: async (customerData) => {
    const { data, error } = await supabase
      .from('customers')
      .insert(toDb(customerData as Partial<Customer>))
      .select()
      .single();

    if (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }

    const customer = fromDb(data);
    set({ customers: [customer, ...get().customers] });
    return customer;
  },

  updateCustomer: async (id, updates) => {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...toDb(updates), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update customer:', error);
      return;
    }

    const updated = fromDb(data);
    set({
      customers: get().customers.map(c => (c.id === id ? updated : c)),
      selectedCustomer: get().selectedCustomer?.id === id ? updated : get().selectedCustomer,
    });
  },

  deleteCustomer: async (id) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete customer:', error);
      return;
    }

    set({
      customers: get().customers.filter(c => c.id !== id),
      selectedCustomer: get().selectedCustomer?.id === id ? null : get().selectedCustomer,
    });
  },

  selectCustomer: (id) => {
    if (id === null) {
      set({ selectedCustomer: null });
    } else {
      const customer = get().customers.find(c => c.id === id) || null;
      set({ selectedCustomer: customer });
    }
  },
}));
