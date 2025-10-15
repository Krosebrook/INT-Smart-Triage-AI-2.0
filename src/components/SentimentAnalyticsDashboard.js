import { supabase } from '../services/supabaseClient.js';

export class SentimentAnalyticsDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.timeRange = 'week';
    this.analyticsData = null;
    this.csrPerformance = [];
  }

  async init() {
    await this.loadAnalytics();
    this.render();
  }

  async loadAnalytics() {
    const { startDate, endDate } = this.getDateRange();

    const [sentimentResult, performanceResult, ticketsResult] = await Promise.all([
      supabase
        .from('sentiment_analytics')
        .select('*')
        .gte('period_start', startDate)
        .lte('period_end', endDate),

      supabase
        .from('csr_performance')
        .select('*, csr:users(name, email)')
        .gte('period_start', startDate)
        .lte('period_end', endDate),

      supabase
        .from('tickets')
        .select('sentiment_score, status, priority, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    ]);

    this.sentimentData = sentimentResult.data || [];
    this.csrPerformance = performanceResult.data || [];
    this.tickets = ticketsResult.data || [];

    this.analyticsData = this.computeAnalytics();
  }

  getDateRange() {
    const endDate = new Date();
    const startDate = new Date();

    switch (this.timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }

  computeAnalytics() {
    const totalTickets = this.tickets.length;
    const sentimentScores = this.tickets
      .filter(t => t.sentiment_score !== null)
      .map(t => t.sentiment_score);

    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0;

    const positive = sentimentScores.filter(s => s >= 0.2).length;
    const neutral = sentimentScores.filter(s => s > -0.2 && s < 0.2).length;
    const negative = sentimentScores.filter(s => s <= -0.2).length;

    const statusBreakdown = {
      open: this.tickets.filter(t => t.status === 'open').length,
      in_progress: this.tickets.filter(t => t.status === 'in_progress').length,
      resolved: this.tickets.filter(t => t.status === 'resolved').length,
      closed: this.tickets.filter(t => t.status === 'closed').length
    };

    const priorityBreakdown = {
      urgent: this.tickets.filter(t => t.priority === 'urgent').length,
      high: this.tickets.filter(t => t.priority === 'high').length,
      medium: this.tickets.filter(t => t.priority === 'medium').length,
      low: this.tickets.filter(t => t.priority === 'low').length
    };

    const trendData = this.computeTrendData();

    return {
      totalTickets,
      avgSentiment,
      sentimentBreakdown: { positive, neutral, negative },
      statusBreakdown,
      priorityBreakdown,
      trendData
    };
  }

  computeTrendData() {
    const days = 7;
    const trend = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTickets = this.tickets.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate >= date && ticketDate < nextDate;
      });

      const daySentiment = dayTickets
        .filter(t => t.sentiment_score !== null)
        .map(t => t.sentiment_score);

      const avgSentiment = daySentiment.length > 0
        ? daySentiment.reduce((a, b) => a + b, 0) / daySentiment.length
        : 0;

      trend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sentiment: avgSentiment,
        count: dayTickets.length
      });
    }

    return trend;
  }

  render() {
    if (!this.analyticsData) {
      this.container.innerHTML = '<div class="loading">Loading analytics...</div>';
      return;
    }

    const data = this.analyticsData;
    const sentimentColor = this.getSentimentColor(data.avgSentiment);
    const sentimentLabel = this.getSentimentLabel(data.avgSentiment);

    this.container.innerHTML = `
      <div class="analytics-dashboard">
        <div class="analytics-header">
          <h3>Customer Sentiment Analytics</h3>
          <select id="timeRangeSelect" class="filter-select">
            <option value="day">Last 24 Hours</option>
            <option value="week" selected>Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
        </div>

        <div class="analytics-overview">
          <div class="stat-card-large">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">${data.totalTickets}</div>
              <div class="stat-label">Total Tickets</div>
            </div>
          </div>

          <div class="stat-card-large">
            <div class="stat-icon" style="color: ${sentimentColor}">😊</div>
            <div class="stat-content">
              <div class="stat-value" style="color: ${sentimentColor}">${sentimentLabel}</div>
              <div class="stat-label">Average Sentiment</div>
              <div class="stat-sublabel">${data.avgSentiment.toFixed(2)}</div>
            </div>
          </div>

          <div class="stat-card-large">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-value">${this.calculateResolutionRate()}%</div>
              <div class="stat-label">Resolution Rate</div>
            </div>
          </div>
        </div>

        <div class="analytics-grid">
          <div class="analytics-card">
            <h4>Sentiment Distribution</h4>
            ${this.renderSentimentChart(data.sentimentBreakdown)}
          </div>

          <div class="analytics-card">
            <h4>Status Breakdown</h4>
            ${this.renderStatusChart(data.statusBreakdown)}
          </div>

          <div class="analytics-card">
            <h4>Priority Distribution</h4>
            ${this.renderPriorityChart(data.priorityBreakdown)}
          </div>

          <div class="analytics-card full-width">
            <h4>Sentiment Trend (7 Days)</h4>
            ${this.renderTrendChart(data.trendData)}
          </div>

          <div class="analytics-card full-width">
            <h4>CSR Performance</h4>
            ${this.renderCSRPerformance()}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderSentimentChart(breakdown) {
    const total = breakdown.positive + breakdown.neutral + breakdown.negative;
    if (total === 0) return '<div class="empty-state">No data</div>';

    const positivePercent = (breakdown.positive / total) * 100;
    const neutralPercent = (breakdown.neutral / total) * 100;
    const negativePercent = (breakdown.negative / total) * 100;

    return `
      <div class="chart-container">
        <div class="bar-chart horizontal">
          <div class="bar-segment positive" style="width: ${positivePercent}%"></div>
          <div class="bar-segment neutral" style="width: ${neutralPercent}%"></div>
          <div class="bar-segment negative" style="width: ${negativePercent}%"></div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color positive"></span>
            <span>Positive: ${breakdown.positive} (${positivePercent.toFixed(0)}%)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color neutral"></span>
            <span>Neutral: ${breakdown.neutral} (${neutralPercent.toFixed(0)}%)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color negative"></span>
            <span>Negative: ${breakdown.negative} (${negativePercent.toFixed(0)}%)</span>
          </div>
        </div>
      </div>
    `;
  }

  renderStatusChart(breakdown) {
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    if (total === 0) return '<div class="empty-state">No data</div>';

    return `
      <div class="chart-container">
        <div class="status-bars">
          ${Object.entries(breakdown).map(([status, count]) => `
            <div class="status-bar-row">
              <span class="status-label">${status.replace('_', ' ')}</span>
              <div class="status-bar">
                <div class="status-bar-fill status-${status}" style="width: ${(count / total) * 100}%"></div>
              </div>
              <span class="status-count">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderPriorityChart(breakdown) {
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    if (total === 0) return '<div class="empty-state">No data</div>';

    return `
      <div class="chart-container">
        <div class="priority-bars">
          ${Object.entries(breakdown).map(([priority, count]) => `
            <div class="priority-bar-row">
              <span class="priority-label priority-${priority}">${priority}</span>
              <div class="priority-bar">
                <div class="priority-bar-fill priority-${priority}" style="width: ${(count / total) * 100}%"></div>
              </div>
              <span class="priority-count">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderTrendChart(trendData) {
    const maxCount = Math.max(...trendData.map(d => d.count));

    return `
      <div class="trend-chart">
        ${trendData.map(day => {
          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
          const color = this.getSentimentColor(day.sentiment);
          return `
            <div class="trend-bar-container">
              <div class="trend-bar" style="height: ${height}%; background-color: ${color}">
                <span class="trend-value">${day.count}</span>
              </div>
              <span class="trend-label">${day.date}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderCSRPerformance() {
    if (this.csrPerformance.length === 0) {
      return '<div class="empty-state">No performance data available</div>';
    }

    return `
      <div class="performance-table">
        <table>
          <thead>
            <tr>
              <th>CSR</th>
              <th>Tickets Handled</th>
              <th>Avg Resolution Time</th>
              <th>Customer Satisfaction</th>
              <th>Quality Score</th>
            </tr>
          </thead>
          <tbody>
            ${this.csrPerformance.map(perf => `
              <tr>
                <td>${this.escapeHtml(perf.csr?.name || 'Unknown')}</td>
                <td>${perf.tickets_handled}</td>
                <td>${this.formatInterval(perf.avg_resolution_time)}</td>
                <td>${perf.customer_satisfaction ? perf.customer_satisfaction.toFixed(1) : 'N/A'}</td>
                <td>
                  <div class="quality-score">
                    <div class="quality-bar">
                      <div class="quality-bar-fill" style="width: ${(perf.quality_score || 0) * 100}%"></div>
                    </div>
                    <span>${((perf.quality_score || 0) * 100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  calculateResolutionRate() {
    const resolved = this.analyticsData.statusBreakdown.resolved + this.analyticsData.statusBreakdown.closed;
    const total = this.analyticsData.totalTickets;
    return total > 0 ? Math.round((resolved / total) * 100) : 0;
  }

  getSentimentColor(sentiment) {
    if (sentiment >= 0.2) return '#10b981';
    if (sentiment >= -0.2) return '#6b7280';
    return '#ef4444';
  }

  getSentimentLabel(sentiment) {
    if (sentiment >= 0.5) return 'Very Positive';
    if (sentiment >= 0.2) return 'Positive';
    if (sentiment >= -0.2) return 'Neutral';
    if (sentiment >= -0.5) return 'Negative';
    return 'Very Negative';
  }

  formatInterval(interval) {
    if (!interval) return 'N/A';
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (!match) return interval;

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);

    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  attachEventListeners() {
    const timeRangeSelect = document.getElementById('timeRangeSelect');
    if (timeRangeSelect) {
      timeRangeSelect.value = this.timeRange;
      timeRangeSelect.addEventListener('change', async (e) => {
        this.timeRange = e.target.value;
        await this.loadAnalytics();
        this.render();
      });
    }
  }
}
