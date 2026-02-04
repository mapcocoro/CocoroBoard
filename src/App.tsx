import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerDetail } from './components/customers/CustomerDetail';
import { ProjectList } from './components/projects/ProjectList';
import { ProjectDetail } from './components/projects/ProjectDetail';
import { TaskList } from './components/tasks/TaskList';
import { InvoiceList } from './components/invoices/InvoiceList';
import { useCustomerStore, useProjectStore, useTaskStore, useInvoiceStore } from './stores';

function App() {
  const loadCustomers = useCustomerStore((state) => state.loadCustomers);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const loadInvoices = useInvoiceStore((state) => state.loadInvoices);

  useEffect(() => {
    loadCustomers();
    loadProjects();
    loadTasks();
    loadInvoices();
  }, [loadCustomers, loadProjects, loadTasks, loadInvoices]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="invoices" element={<InvoiceList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
