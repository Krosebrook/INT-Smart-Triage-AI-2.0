import type { FC } from 'react';
import type { NavigationItem, SidebarNavProps } from './types';
import styles from './SidebarNav.module.css';

const getItemAriaCurrent = (item: NavigationItem, activeItemId?: string) =>
  item.id === activeItemId ? 'page' : undefined;

const SidebarNav: FC<SidebarNavProps> = ({ items, activeItemId, onSelect, footer }) => {
  return (
    <nav className={styles.sidebar} aria-label="Primary navigation">
      <ul className={styles.list}>
        {items.map((item) => {
          const isActive = item.id === activeItemId;
          return (
            <li key={item.id} className={styles.listItem}>
              <button
                type="button"
                className={isActive ? styles.buttonActive : styles.button}
                aria-current={getItemAriaCurrent(item, activeItemId)}
                onClick={() => {
                  if (onSelect) {
                    onSelect(item);
                  }
                }}
              >
                {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
                <span className={styles.label}>{item.label}</span>
                {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </nav>
  );
};

export default SidebarNav;
