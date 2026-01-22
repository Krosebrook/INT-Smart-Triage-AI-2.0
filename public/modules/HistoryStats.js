export class HistoryStats {
    constructor(container) {
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lastRender", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        if (!container) {
            throw new Error('HistoryStats requires a valid container element');
        }
        this.container = container;
        this.container.classList.add('history-stats');
        this.container.setAttribute('data-testid', 'history-stats');
        this.hide();
    }
    render(props) {
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
    hide() {
        this.container.innerHTML = '';
        this.container.style.display = 'none';
        this.container.removeAttribute('aria-live');
        this.lastRender = null;
    }
    getLastRender() {
        return this.lastRender;
    }
    renderStatusRow(status, total) {
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
    renderHighlight(highlight) {
        const accentClass = highlight.accent ? ` history-stats__highlight--${highlight.accent}` : '';
        return `
      <div class="history-stats__highlight${accentClass}" data-testid="history-highlight">
        <span class="history-stats__highlight-count">${highlight.count}</span>
        <span class="history-stats__highlight-label">${highlight.label}</span>
      </div>
    `;
    }
}
