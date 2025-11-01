import { forecastingService } from '../services/forecastingService.js';

export class ForecastDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.forecasts = [];
    this.accuracy = null;
    this.error = null;
  }

  async init() {
    await this.loadData();
    this.render();
  }

  async loadData() {
    try {
      const [forecasts, accuracy] = await Promise.all([
        forecastingService.getForecasts(7),
        forecastingService.calculateAccuracy()
      ]);

      this.forecasts = forecasts;
      this.accuracy = accuracy;
      this.error = null;
    } catch (error) {
      console.error('Failed to load forecast data', error);
      this.error = error.message || 'Forecasting service unavailable';
      this.forecasts = [];
      this.accuracy = null;
    }
  }

  async generateNewForecast() {
    try {
      await forecastingService.generateForecast(7);
      await this.loadData();
      this.render();
    } catch (error) {
      console.error('Failed to generate forecast', error);
      this.error = error.message || 'Unable to generate forecast';
      this.render();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="forecast-dashboard">
        <div class="forecast-header">
          <h3>Ticket Volume Forecasting</h3>
          <button class="btn-primary btn-small" onclick="window.forecastDashboard.generateNewForecast()">
            🔮 Generate Forecast
          </button>
        </div>

        ${this.error ? `
          <div class="error-banner">
            <strong>Forecast service warning:</strong> ${this.error}
          </div>
        ` : ''}

        ${this.accuracy ? `
          <div class="accuracy-banner">
            <h4>Forecast Accuracy</h4>
            <div class="accuracy-stats">
              <div class="accuracy-stat">
                <span class="stat-value">${this.accuracy.mape}%</span>
                <span class="stat-label">MAPE</span>
              </div>
              <div class="accuracy-stat">
                <span class="stat-value">±${this.accuracy.avgError}</span>
                <span class="stat-label">Avg Error</span>
              </div>
              <div class="accuracy-stat">
                <span class="stat-value">${this.accuracy.totalForecasts}</span>
                <span class="stat-label">Forecasts</span>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="forecast-chart">
          ${this.renderForecastChart()}
        </div>

        <div class="forecast-table">
          <h4>7-Day Forecast</h4>
          ${this.renderForecastTable()}
        </div>

        <div class="staffing-recommendations">
          <h4>Staffing Recommendations</h4>
          ${this.renderStaffingRecommendations()}
        </div>
      </div>
    `;
  }

  renderForecastChart() {
    if (this.forecasts.length === 0) {
      return '<div class="empty-state">No forecast data available. Generate a forecast to get started.</div>';
    }

    const maxVolume = Math.max(...this.forecasts.map(f => f.predicted_volume));

    return `
      <div class="chart-container">
        <div class="forecast-bars">
          ${this.forecasts.map(forecast => {
            const height = (forecast.predicted_volume / maxVolume) * 100;
            const date = new Date(forecast.forecast_date);
            const isToday = this.isToday(date);
            const confidence = (forecast.confidence_level * 100).toFixed(0);

            return `
              <div class="forecast-bar-container ${isToday ? 'today' : ''}">
                <div class="forecast-bar" style="height: ${height}%">
                  <span class="forecast-value">${forecast.predicted_volume}</span>
                  <span class="confidence-badge">${confidence}%</span>
                </div>
                <div class="forecast-label">
                  <div class="date-label">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div class="day-label">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  ${forecast.actual_volume !== null ? `
                    <div class="actual-label">Actual: ${forecast.actual_volume}</div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderForecastTable() {
    if (this.forecasts.length === 0) {
      return '<div class="empty-state">No forecasts available</div>';
    }

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>Predicted Volume</th>
            <th>Confidence</th>
            <th>Actual Volume</th>
            <th>Variance</th>
          </tr>
        </thead>
        <tbody>
          ${this.forecasts.map(forecast => {
            const date = new Date(forecast.forecast_date);
            const variance = forecast.actual_volume !== null
              ? forecast.predicted_volume - forecast.actual_volume
              : null;

            return `
              <tr>
                <td>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>${date.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                <td><strong>${forecast.predicted_volume}</strong></td>
                <td>
                  <div class="confidence-indicator">
                    <div class="confidence-bar">
                      <div class="confidence-fill" style="width: ${forecast.confidence_level * 100}%"></div>
                    </div>
                    <span>${(forecast.confidence_level * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td>${forecast.actual_volume !== null ? forecast.actual_volume : '-'}</td>
                <td>
                  ${variance !== null ? `
                    <span class="variance ${variance > 0 ? 'over' : 'under'}">
                      ${variance > 0 ? '+' : ''}${variance}
                    </span>
                  ` : '-'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  renderStaffingRecommendations() {
    if (this.forecasts.length === 0) {
      return '<div class="empty-state">Generate a forecast to see staffing recommendations</div>';
    }

    const ticketsPerCSRPerDay = 15;

    return `
      <div class="staffing-grid">
        ${this.forecasts.map(forecast => {
          const date = new Date(forecast.forecast_date);
          const recommendedStaff = Math.ceil(forecast.predicted_volume / ticketsPerCSRPerDay);
          const isHighVolume = forecast.predicted_volume > 50;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return `
            <div class="staffing-card ${isHighVolume ? 'high-volume' : ''}">
              <div class="staffing-date">
                <div>${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <div class="staffing-recommendation">
                <div class="staff-count">${recommendedStaff}</div>
                <div class="staff-label">CSRs needed</div>
              </div>
              <div class="staffing-notes">
                <div>Expected: ${forecast.predicted_volume} tickets</div>
                ${isWeekend ? '<div class="note-badge">Weekend</div>' : ''}
                ${isHighVolume ? '<div class="note-badge alert">High Volume</div>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="staffing-note">
        <p>Based on average of ${ticketsPerCSRPerDay} tickets per CSR per day</p>
      </div>
    `;
  }

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
}
