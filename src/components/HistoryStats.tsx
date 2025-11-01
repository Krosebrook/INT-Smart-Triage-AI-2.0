export type StatusMetric = {
  key: string;
  label: string;
  count: number;
};

export type HighlightMetric = {
  label: string;
  count: number;
  accent?: 'neutral' | 'warning' | 'success';
};

export interface HistoryStatsProps {
  total: number;
  statuses: StatusMetric[];
  highlights?: HighlightMetric[];
}

export class HistoryStats {
  private readonly container: HTMLElement;
  private lastRender: HistoryStatsProps | null = null;

  constructor(container: HTMLElement) {
    if (!container) {
      throw new Error('HistoryStats requires a valid container element');
    }

    this.container = container;
    this.container.classList.add('history-stats');
    this.container.setAttribute('data-testid', 'history-stats');
    this.hide();
  }

  public render(props: HistoryStatsProps): void {
    this.lastRender = props;

    const safeTotal = Math.max(props.total, 0);
    const totalFromStatuses = props.statuses.reduce((sum, status) => sum + status.count, 0);
    const denominator = totalFromStatuses > 0 ? totalFromStatuses : safeTotal;

    const sortedStatuses = [...props.statuses].sort((a, b) => b.count - a.count);

    const statusRows = sortedStatuses
      .map((status) => this.renderStatusRow(status, denominator))
      .join('');

    const highlights = (props.highlights || [])
      .filter((highlight) => highlight.count > 0)
      .map((highlight) => this.renderHighlight(highlight))
      .join('');

    const highlightSection = highlights
      ? `<div class="history-stats__highlights" data-testid="history-stats-highlights">${highlights}</div>`
      : '';

    this.container.innerHTML = `
      <div class="history-stats__summary">
        <div class="history-stats__total" data-testid="history-stats-total">${safeTotal}</div>
        <div class="history-stats__subtitle">Total Reports</div>
      </div>
      ${highlightSection}
      <div class="history-stats__bars" role="list">
        ${statusRows || '<div class="history-stats__empty">No status data available</div>'}
      </div>
    `;

    this.container.style.display = 'block';
    this.container.setAttribute('aria-live', 'polite');
  }

  public hide(): void {
    this.container.innerHTML = '';
    this.container.style.display = 'none';
    this.container.removeAttribute('aria-live');
    this.lastRender = null;
  }

  public getLastRender(): HistoryStatsProps | null {
    return this.lastRender;
  }

  private renderStatusRow(status: StatusMetric, total: number): string {
    const percent = total > 0 ? Math.round((status.count / total) * 100) : 0;
    const safePercent = Math.min(Math.max(percent, 0), 100);

    return `
      <div class="history-stats__row" role="listitem" data-testid="history-status-row" data-status="${status.key}">
        <div class="history-stats__row-header">
          <span class="history-stats__row-label">${status.label}</span>
          <span class="history-stats__row-value" data-testid="history-status-count">${status.count}</span>
        </div>
        <div class="history-stats__bar" aria-valuenow="${safePercent}" aria-valuemin="0" aria-valuemax="100">
          <div class="history-stats__bar-fill status-${status.key}" style="width: ${safePercent}%"></div>
        </div>
        <span class="history-stats__percent" aria-hidden="true">${safePercent}%</span>
      </div>
    `;
  }

  private renderHighlight(highlight: HighlightMetric): string {
    const accentClass = highlight.accent ? ` history-stats__highlight--${highlight.accent}` : '';
    return `
      <div class="history-stats__highlight${accentClass}" data-testid="history-highlight">
        <span class="history-stats__highlight-count">${highlight.count}</span>
        <span class="history-stats__highlight-label">${highlight.label}</span>
      </div>
    `;
  }
}
