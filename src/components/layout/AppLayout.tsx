import type { FC, ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import MainContent from './MainContent';
import SidebarNav from './SidebarNav';
import TopBar from './TopBar';
import type { AppLayoutProps, NavigationItem } from './types';
import styles from './AppLayout.module.css';

const AppLayout: FC<AppLayoutProps> = ({
  title,
  subtitle,
  navigation,
  activeNavigationId,
  onNavigate,
  headerActions,
  statusIndicators,
  footer,
  sidebarFooter,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const deriveActiveId = (): string | undefined => {
    if (activeNavigationId) {
      return activeNavigationId;
    }

    const candidates = navigation.filter((item) => item.path && location.pathname.startsWith(item.path));
    if (candidates.length === 0) {
      return undefined;
    }

    const [bestMatch] = [...candidates].sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));
    return bestMatch?.id;
  };

  const handleSelect = (item: NavigationItem) => {
    if (item.path) {
      navigate(item.path);
    }
    if (onNavigate) {
      onNavigate(item);
    }
  };

  const content: ReactNode = children ?? <Outlet />;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebarRegion}>
        <SidebarNav
          items={navigation}
          activeItemId={deriveActiveId()}
          onSelect={handleSelect}
          footer={sidebarFooter}
        />
      </aside>
      <div className={styles.mainRegion}>
        <TopBar title={title} subtitle={subtitle} actions={headerActions} statusIndicators={statusIndicators} />
        <MainContent>{content}</MainContent>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>
  );
};

export default AppLayout;
