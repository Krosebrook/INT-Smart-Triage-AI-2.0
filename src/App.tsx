import type { FC, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AppLayout } from './components/layout';
import type { NavigationItem, StatusIndicator } from './components/layout';

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
  { id: 'tickets', label: 'Tickets', icon: '🎫', path: '/tickets' },
  { id: 'analytics', label: 'Analytics', icon: '📈', path: '/analytics' },
];

const statusIndicators: StatusIndicator[] = [
  { id: 'sla', label: 'SLA', value: '98%', tone: 'success' },
  { id: 'queue', label: 'Open Tickets', value: '24', tone: 'warning' },
  { id: 'csat', label: 'CSAT', value: '4.7', tone: 'info' },
];

const headerActions: ReactNode = (
  <div
    style={{
      display: 'flex',
      gap: '0.75rem',
    }}
  >
    <button
      type="button"
      style={{
        background: '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '999px',
        padding: '0.6rem 1.1rem',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 10px 24px -18px rgba(37, 99, 235, 0.8)',
      }}
    >
      New Ticket
    </button>
    <button
      type="button"
      style={{
        background: 'rgba(37, 99, 235, 0.1)',
        color: '#2563eb',
        border: 'none',
        borderRadius: '999px',
        padding: '0.6rem 1.1rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Export
    </button>
  </div>
);

const footerContent: ReactNode = (
  <span>INT Smart Triage AI • Operational visibility for modern support teams.</span>
);

const sidebarFooter: ReactNode = (
  <div>
    <strong>Support Hours</strong>
    <p>24/7 global coverage</p>
  </div>
);

const App: FC = () => {
  return (
    <AppLayout
      title="INT Smart Triage AI"
      subtitle="Real-time support visibility and intelligent routing"
      navigation={navigationItems}
      headerActions={headerActions}
      statusIndicators={statusIndicators}
      footer={footerContent}
      sidebarFooter={sidebarFooter}
    >
      <Outlet />
    </AppLayout>
  );
};

export default App;
