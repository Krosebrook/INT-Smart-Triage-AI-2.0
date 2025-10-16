// Advanced Analytics Service
import { supabase } from './supabaseClient.js';

export async function getTicketVolumeByDay(days = 30) {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('reports')
      .select('created_at, priority')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const volumeByDay = {};
    data.forEach((report) => {
      const date = new Date(report.created_at).toLocaleDateString();
      volumeByDay[date] = (volumeByDay[date] || 0) + 1;
    });

    return {
      success: true,
      data: Object.entries(volumeByDay).map(([date, count]) => ({
        date,
        count,
      })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPriorityDistribution() {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase.from('reports').select('priority');

    if (error) throw error;

    const distribution = {
      high: 0,
      medium: 0,
      low: 0,
    };

    data.forEach((report) => {
      distribution[report.priority] = (distribution[report.priority] || 0) + 1;
    });

    const total = data.length;

    return {
      success: true,
      data: {
        counts: distribution,
        percentages: {
          high: total > 0 ? ((distribution.high / total) * 100).toFixed(1) : 0,
          medium:
            total > 0 ? ((distribution.medium / total) * 100).toFixed(1) : 0,
          low: total > 0 ? ((distribution.low / total) * 100).toFixed(1) : 0,
        },
        total,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getDepartmentWorkload() {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('metadata, status')
      .gte(
        'created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    const workload = {};
    data.forEach((report) => {
      const dept = report.metadata?.department || 'Unknown';
      if (!workload[dept]) {
        workload[dept] = { total: 0, pending: 0, resolved: 0 };
      }
      workload[dept].total++;
      if (report.status === 'resolved') {
        workload[dept].resolved++;
      } else {
        workload[dept].pending++;
      }
    });

    return {
      success: true,
      data: Object.entries(workload).map(([department, stats]) => ({
        department,
        ...stats,
        utilization:
          stats.total > 0
            ? ((stats.pending / stats.total) * 100).toFixed(1)
            : 0,
      })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getCSRPerformanceMetrics() {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('csr_agent, status, created_at, resolved_at')
      .gte(
        'created_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    const metrics = {};
    data.forEach((report) => {
      const agent = report.csr_agent || 'Unknown';
      if (!metrics[agent]) {
        metrics[agent] = {
          totalTickets: 0,
          resolved: 0,
          pending: 0,
          totalResolutionTime: 0,
          resolvedCount: 0,
        };
      }

      metrics[agent].totalTickets++;
      if (report.status === 'resolved') {
        metrics[agent].resolved++;
        if (report.resolved_at) {
          const resolutionTime =
            new Date(report.resolved_at) - new Date(report.created_at);
          metrics[agent].totalResolutionTime += resolutionTime;
          metrics[agent].resolvedCount++;
        }
      } else {
        metrics[agent].pending++;
      }
    });

    return {
      success: true,
      data: Object.entries(metrics).map(([agent, stats]) => ({
        agent,
        totalTickets: stats.totalTickets,
        resolved: stats.resolved,
        pending: stats.pending,
        resolutionRate:
          stats.totalTickets > 0
            ? ((stats.resolved / stats.totalTickets) * 100).toFixed(1)
            : 0,
        avgResolutionTime:
          stats.resolvedCount > 0
            ? (
                stats.totalResolutionTime /
                stats.resolvedCount /
                (1000 * 60 * 60)
              ).toFixed(1)
            : 0,
      })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getResponseTimeAnalysis() {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('created_at, assigned_at, resolved_at, priority')
      .not('assigned_at', 'is', null)
      .gte(
        'created_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    const analysis = {
      high: { times: [], count: 0 },
      medium: { times: [], count: 0 },
      low: { times: [], count: 0 },
    };

    data.forEach((report) => {
      if (report.assigned_at) {
        const responseTime =
          (new Date(report.assigned_at) - new Date(report.created_at)) /
          (1000 * 60);
        analysis[report.priority].times.push(responseTime);
        analysis[report.priority].count++;
      }
    });

    const calculateAvg = (times) =>
      times.length > 0
        ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)
        : 0;

    return {
      success: true,
      data: {
        high: {
          count: analysis.high.count,
          avgResponseMinutes: calculateAvg(analysis.high.times),
        },
        medium: {
          count: analysis.medium.count,
          avgResponseMinutes: calculateAvg(analysis.medium.times),
        },
        low: {
          count: analysis.low.count,
          avgResponseMinutes: calculateAvg(analysis.low.times),
        },
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPredictiveTicketVolume() {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('created_at')
      .gte(
        'created_at',
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      )
      .order('created_at', { ascending: true });

    if (error) throw error;

    const hourlyVolume = {};
    data.forEach((report) => {
      const date = new Date(report.created_at);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${dayOfWeek}-${hour}`;
      hourlyVolume[key] = (hourlyVolume[key] || 0) + 1;
    });

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const predictions = [];

    for (let hour = now.getHours(); hour < now.getHours() + 24; hour++) {
      const predictHour = hour % 24;
      const predictDay = currentDayOfWeek + Math.floor(hour / 24);
      const key = `${predictDay % 7}-${predictHour}`;
      const historicalAvg = hourlyVolume[key] || 0;

      predictions.push({
        hour: predictHour,
        day: predictDay % 7,
        predictedVolume: Math.round(historicalAvg / 8),
      });
    }

    return {
      success: true,
      data: predictions,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function exportAnalyticsData(format = 'json', filters = {}) {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    let query = supabase.from('reports').select('*');

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.department) {
      query = query.contains('metadata', { department: filters.department });
    }

    const { data, error } = await query;

    if (error) throw error;

    if (format === 'csv') {
      const csvData = convertToCSV(data);
      return { success: true, data: csvData, format: 'csv' };
    }

    return { success: true, data, format: 'json' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/"/g, '""');
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}
