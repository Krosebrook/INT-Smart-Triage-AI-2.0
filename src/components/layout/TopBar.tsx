import type { FC } from 'react';
import type { IndicatorTone, TopBarProps } from './types';
import styles from './TopBar.module.css';

const toneClassName: Record<IndicatorTone, string> = {
  neutral: styles.indicatorNeutral,
  info: styles.indicatorInfo,
  success: styles.indicatorSuccess,
  warning: styles.indicatorWarning,
  danger: styles.indicatorDanger,
};

const TopBar: FC<TopBarProps> = ({ title, subtitle, actions, statusIndicators }) => {
  return (
    <header className={styles.topBar} role="banner">
      <div className={styles.textGroup}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {(statusIndicators?.length ?? 0) > 0 ? (
        <ul className={styles.indicators} aria-label="status indicators">
          {statusIndicators!.map((indicator) => (
            <li key={indicator.id} className={styles.indicator}>
              <span
                className={toneClassName[indicator.tone ?? 'neutral']}
                aria-hidden="true"
              />
              <div className={styles.indicatorContent}>
                <span className={styles.indicatorLabel}>{indicator.label}</span>
                <span className={styles.indicatorValue}>{indicator.value}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
};

export default TopBar;
