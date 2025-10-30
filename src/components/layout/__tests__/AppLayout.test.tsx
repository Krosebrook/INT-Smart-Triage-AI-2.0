import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../../layout';
import type { NavigationItem, StatusIndicator } from '../../layout';

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
  { id: 'tickets', label: 'Tickets', icon: '🎫', path: '/tickets' },
  { id: 'analytics', label: 'Analytics', icon: '📈', path: '/analytics' },
];

const indicators: StatusIndicator[] = [
  { id: 'sla', label: 'SLA', value: '98%', tone: 'success' },
];

describe('AppLayout', () => {
  it('highlights the active navigation item based on the current route', () => {
    render(
      <MemoryRouter initialEntries={['/tickets']}>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout
                title="INT Smart Triage AI"
                subtitle="Operational visibility"
                navigation={navigationItems}
                statusIndicators={indicators}
              />
            }
          >
            <Route index element={<div>Dashboard</div>} />
            <Route path="tickets" element={<div>Tickets</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const ticketsButton = screen.getByRole('button', { name: /tickets/i });
    expect(ticketsButton).toHaveAttribute('aria-current', 'page');
  });

  it('navigates to the selected item and emits navigate events', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout
                title="INT Smart Triage AI"
                subtitle="Operational visibility"
                navigation={navigationItems}
                statusIndicators={indicators}
                onNavigate={handleNavigate}
              />
            }
          >
            <Route index element={<div>Dashboard</div>} />
            <Route path="tickets" element={<div>Tickets</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /tickets/i }));

    expect(handleNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tickets', path: '/tickets' }),
    );
    expect(screen.getByText('Tickets', { selector: 'div' })).toBeInTheDocument();
  });

  it('handles navigation items without explicit routes gracefully', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    const customNavigation: NavigationItem[] = [
      ...navigationItems,
      { id: 'reports', label: 'Reports', icon: '🗂️' },
    ];

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout
                title="INT Smart Triage AI"
                subtitle="Operational visibility"
                navigation={customNavigation}
                statusIndicators={indicators}
                onNavigate={handleNavigate}
              />
            }
          >
            <Route index element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /reports/i }));

    expect(handleNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'reports' }));
    expect(screen.getByText('Dashboard', { selector: 'div' })).toBeInTheDocument();
  });
});
