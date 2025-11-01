import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import {
  AppLayout,
  SidebarNav,
  TopBar,
  type NavigationItem,
  type StatusIndicator,
} from '../src/components/layout';

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
  { id: 'tickets', label: 'Tickets', icon: '🎫', path: '/tickets', badge: '8' },
  { id: 'analytics', label: 'Analytics', icon: '📈', path: '/analytics' },
];

const indicators: StatusIndicator[] = [
  { id: 'sla', label: 'SLA', value: '98%', tone: 'success' },
  { id: 'queue', label: 'Queue', value: '24', tone: 'warning' },
];

const meta: Meta<typeof AppLayout> = {
  title: 'Layout/AppLayout',
  component: AppLayout,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppLayout>;

export const Default: Story = {
  args: {
    title: 'INT Smart Triage AI',
    subtitle: 'Operational hub for modern success teams',
    navigation: navigationItems,
    statusIndicators: indicators,
    headerActions: (
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
        }}
      >
        Primary Action
      </button>
    ),
    sidebarFooter: (
      <div>
        <strong>Support Hours</strong>
        <p>24/7 global coverage</p>
      </div>
    ),
    footer: 'INT Smart Triage AI • Operational visibility for modern support teams.',
    children: (
      <div>
        <h2>Dashboard</h2>
        <p>
          Showcase live ticket analytics, agent load, and sentiment trends inside this flexible
          content region.
        </p>
      </div>
    ),
  },
};

export const BuildingBlocks = () => (
  <div style={{ display: 'grid', gap: '1.5rem' }}>
    <TopBar
      title="Live Ticket Dashboard"
      subtitle="Monitor backlog, SLAs, and priority alerts"
      statusIndicators={indicators}
    />
    <SidebarNav items={navigationItems} activeItemId="tickets" />
  </div>
);
