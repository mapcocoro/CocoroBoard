import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Customer } from '../types';
import { createEntityStorage } from '../services/localStorage';

const storage = createEntityStorage<Customer>('customer');

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;

  // アクション
  loadCustomers: () => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  selectCustomer: (id: string | null) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  selectedCustomer: null,
  isLoading: false,

  loadCustomers: () => {
    set({ isLoading: true });
    const customers = storage.getAll();
    set({ customers, isLoading: false });
  },

  addCustomer: (customerData) => {
    const now = new Date().toISOString();
    const customer: Customer = {
      ...customerData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    storage.create(customer);
    set({ customers: [...get().customers, customer] });
    return customer;
  },

  updateCustomer: (id, updates) => {
    const updated = storage.update(id, updates);
    if (updated) {
      set({
        customers: get().customers.map(c => (c.id === id ? updated : c)),
        selectedCustomer: get().selectedCustomer?.id === id ? updated : get().selectedCustomer,
      });
    }
  },

  deleteCustomer: (id) => {
    storage.delete(id);
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
