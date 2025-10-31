import type { FC } from 'react';
import type { MainContentProps } from './types';
import styles from './MainContent.module.css';

const MainContent: FC<MainContentProps> = ({ children, padded = true }) => {
  return (
    <section className={padded ? styles.mainPadded : styles.main}>
      {children}
    </section>
  );
};

export default MainContent;
