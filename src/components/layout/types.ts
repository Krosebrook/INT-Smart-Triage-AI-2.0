import { ReactNode } from 'react';

export type IndicatorTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusIndicator {
  id: string;
  label: string;
  value: string | number;
  tone?: IndicatorTone;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  path?: string;
}

export interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  statusIndicators?: StatusIndicator[];
}

export interface SidebarNavProps {
  items: NavigationItem[];
  activeItemId?: string;
  onSelect?: (item: NavigationItem) => void;
  footer?: ReactNode;
}

export interface MainContentProps {
  children: ReactNode;
  padded?: boolean;
}

export interface AppLayoutProps {
  title: string;
  subtitle?: string;
  navigation: NavigationItem[];
  activeNavigationId?: string;
  onNavigate?: (item: NavigationItem) => void;
  headerActions?: ReactNode;
  statusIndicators?: StatusIndicator[];
  footer?: ReactNode;
  sidebarFooter?: ReactNode;
  children: ReactNode;
}
