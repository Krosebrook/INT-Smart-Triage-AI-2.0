const DEFAULT_BASE_URL = (import.meta.env.VITE_FORECASTING_API_URL || 'http://localhost:8000').replace(/\/$/, '');

class ForecastingService {
  constructor() {
    this.baseUrl = DEFAULT_BASE_URL;
    this.alertCache = new Set();
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const init = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };

    try {
      const response = await fetch(url, init);
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await response.json() : null;

      if (!response.ok) {
        const message = payload?.detail || `Forecast service error (${response.status})`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }

      return payload ?? {};
    } catch (error) {
      console.error('Forecasting service request failed:', error);
      throw error;
    }
  }

  async generateForecast(daysAhead = 7) {
    const params = new URLSearchParams({ days: String(daysAhead) });
    return this.request(`/forecasts/generate?${params.toString()}`, { method: 'POST' });
  }

  async getForecasts(daysAhead = 7) {
    const params = new URLSearchParams({ days: String(daysAhead) });
    try {
      const response = await this.request(`/forecasts?${params.toString()}`);
      return Array.isArray(response?.forecasts) ? response.forecasts : [];
    } catch (error) {
      if (error.status === 503) {
        console.warn('Forecasting service unavailable. Returning empty dataset.');
      }
      return [];
    }
  }

  async calculateAccuracy() {
    try {
      return await this.request('/forecasts/accuracy');
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      return null;
    }
  }

  async getForecastAlerts(daysAhead = 7) {
    const params = new URLSearchParams({ days: String(daysAhead) });
    try {
      const response = await this.request(`/forecasts/alerts?${params.toString()}`);
      return Array.isArray(response?.alerts) ? response.alerts : [];
    } catch (error) {
      return [];
    }
  }

  summarizeForecasts(forecasts) {
    if (!Array.isArray(forecasts) || forecasts.length === 0) {
      return null;
    }

    const sorted = [...forecasts].sort((a, b) => new Date(a.forecast_date) - new Date(b.forecast_date));
    const total = sorted.reduce((sum, item) => sum + (item.predicted_volume || 0), 0);
    const averageVolume = Math.round(total / sorted.length);
    const firstVolume = sorted[0]?.predicted_volume || 1;
    const lastVolume = sorted[sorted.length - 1]?.predicted_volume || firstVolume;
    const growth = Number((((lastVolume - firstVolume) / Math.max(firstVolume, 1)) * 100).toFixed(1));
    const peakDay = sorted.reduce((max, item) => (item.predicted_volume > max.predicted_volume ? item : max), sorted[0]);
    const highConfidenceDays = sorted.filter(item => (item.confidence_level || 0) >= 0.85).length;

    return {
      averageVolume,
      growth,
      peakDay,
      highConfidenceDays
    };
  }

  alertKey(alert) {
    if (!alert) return null;
    return alert.id || `${alert.forecast_date}-${alert.severity}`;
  }
}

export const forecastingService = new ForecastingService();
