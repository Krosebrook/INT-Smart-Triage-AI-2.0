import { supabase } from './supabaseClient.js';

export class ForecastingService {
  constructor() {
    this.historicalDays = 90;
  }

  async generateForecast(daysAhead = 7) {
    const historicalData = await this.loadHistoricalData();
    const patterns = this.analyzePatterns(historicalData);
    const forecasts = [];

    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);

      const prediction = this.predictVolume(forecastDate, patterns, historicalData);

      const { data, error } = await supabase
        .from('ticket_volume_forecast')
        .insert({
          forecast_date: forecastDate.toISOString().split('T')[0],
          predicted_volume: Math.round(prediction.volume),
          confidence_level: prediction.confidence,
          factors: prediction.factors
        })
        .select()
        .single();

      if (!error && data) {
        forecasts.push(data);
      }
    }

    return forecasts;
  }

  async loadHistoricalData() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.historicalDays);

    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('created_at, priority, category')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error loading historical data:', error);
      return [];
    }

    const dailyVolumes = this.aggregateByDay(tickets || []);
    return dailyVolumes;
  }

  aggregateByDay(tickets) {
    const volumeMap = {};

    tickets.forEach(ticket => {
      const date = new Date(ticket.created_at).toISOString().split('T')[0];
      if (!volumeMap[date]) {
        volumeMap[date] = {
          date,
          count: 0,
          dayOfWeek: new Date(date).getDay(),
          priorities: { urgent: 0, high: 0, medium: 0, low: 0 }
        };
      }
      volumeMap[date].count += 1;
      if (ticket.priority) {
        volumeMap[date].priorities[ticket.priority] = (volumeMap[date].priorities[ticket.priority] || 0) + 1;
      }
    });

    return Object.values(volumeMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  analyzePatterns(historicalData) {
    const dayOfWeekAverages = this.calculateDayOfWeekAverages(historicalData);
    const trend = this.calculateTrend(historicalData);
    const weeklySeasonality = this.calculateWeeklySeasonality(historicalData);

    return {
      dayOfWeekAverages,
      trend,
      weeklySeasonality,
      overallAverage: this.calculateAverage(historicalData.map(d => d.count))
    };
  }

  calculateDayOfWeekAverages(data) {
    const dayGroups = {};

    for (let i = 0; i < 7; i++) {
      dayGroups[i] = [];
    }

    data.forEach(day => {
      dayGroups[day.dayOfWeek].push(day.count);
    });

    const averages = {};
    for (let i = 0; i < 7; i++) {
      averages[i] = dayGroups[i].length > 0
        ? this.calculateAverage(dayGroups[i])
        : 0;
    }

    return averages;
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;

    const recentData = data.slice(-30);
    const olderData = data.slice(-60, -30);

    if (olderData.length === 0) return 0;

    const recentAvg = this.calculateAverage(recentData.map(d => d.count));
    const olderAvg = this.calculateAverage(olderData.map(d => d.count));

    return (recentAvg - olderAvg) / olderAvg;
  }

  calculateWeeklySeasonality(data) {
    const weeks = Math.floor(data.length / 7);
    if (weeks < 2) return 1.0;

    const weeklyTotals = [];
    for (let i = 0; i < weeks; i++) {
      const weekData = data.slice(i * 7, (i + 1) * 7);
      const weekTotal = weekData.reduce((sum, day) => sum + day.count, 0);
      weeklyTotals.push(weekTotal);
    }

    const avgWeekly = this.calculateAverage(weeklyTotals);
    const stdDev = this.calculateStdDev(weeklyTotals);

    return stdDev / avgWeekly;
  }

  predictVolume(forecastDate, patterns, historicalData) {
    const dayOfWeek = forecastDate.getDay();
    const baseVolume = patterns.dayOfWeekAverages[dayOfWeek] || patterns.overallAverage;

    const trendAdjustment = 1 + patterns.trend;
    const predictedVolume = baseVolume * trendAdjustment;

    const factors = {
      base_volume: Math.round(baseVolume),
      day_of_week: this.getDayName(dayOfWeek),
      trend_adjustment: patterns.trend.toFixed(3),
      seasonality: patterns.weeklySeasonality.toFixed(3)
    };

    const confidence = this.calculateConfidence(historicalData, patterns);

    return {
      volume: Math.max(0, predictedVolume),
      confidence,
      factors
    };
  }

  calculateConfidence(historicalData, patterns) {
    let confidence = 0.7;

    if (historicalData.length >= 60) {
      confidence += 0.1;
    }

    if (patterns.weeklySeasonality < 0.3) {
      confidence += 0.1;
    }

    if (Math.abs(patterns.trend) < 0.2) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  calculateStdDev(numbers) {
    const avg = this.calculateAverage(numbers);
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  async getForecasts(daysAhead = 7) {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('ticket_volume_forecast')
      .select('*')
      .gte('forecast_date', startDate)
      .lte('forecast_date', endDate.toISOString().split('T')[0])
      .order('forecast_date', { ascending: true });

    if (error) {
      console.error('Error loading forecasts:', error);
      return [];
    }

    return data || [];
  }

  async updateActualVolume(date) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    const nextDate = new Date(dateStr);
    nextDate.setDate(nextDate.getDate() + 1);

    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id')
      .gte('created_at', dateStr)
      .lt('created_at', nextDate.toISOString().split('T')[0]);

    if (error) {
      console.error('Error counting tickets:', error);
      return;
    }

    const actualVolume = tickets?.length || 0;

    await supabase
      .from('ticket_volume_forecast')
      .update({ actual_volume: actualVolume })
      .eq('forecast_date', dateStr);
  }

  async calculateAccuracy() {
    const { data: forecasts, error } = await supabase
      .from('ticket_volume_forecast')
      .select('*')
      .not('actual_volume', 'is', null);

    if (error || !forecasts || forecasts.length === 0) {
      return null;
    }

    const errors = forecasts.map(f => {
      const error = Math.abs(f.predicted_volume - f.actual_volume);
      const percentError = (error / f.actual_volume) * 100;
      return { error, percentError };
    });

    const mape = errors.reduce((sum, e) => sum + e.percentError, 0) / errors.length;
    const avgError = errors.reduce((sum, e) => sum + e.error, 0) / errors.length;

    return {
      mape: mape.toFixed(2),
      avgError: Math.round(avgError),
      totalForecasts: forecasts.length
    };
  }
}

export const forecastingService = new ForecastingService();
