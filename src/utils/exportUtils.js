export class ExportUtils {
  static exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        const escaped = ('' + value).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    this.downloadFile(csvString, filename, 'text/csv');
  }

  static exportToJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    this.downloadFile(jsonString, filename, 'application/json');
  }

  static exportTicketsToCSV(tickets, filename = 'tickets-export.csv') {
    const exportData = tickets.map(ticket => ({
      ticket_number: ticket.ticket_number,
      customer_name: ticket.customer?.name || '',
      customer_email: ticket.customer?.email || '',
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      subject: ticket.subject,
      channel: ticket.channel,
      assigned_to: ticket.assigned_user?.name || 'Unassigned',
      sentiment_score: ticket.sentiment_score,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      resolved_at: ticket.resolved_at || ''
    }));

    this.exportToCSV(exportData, filename);
  }

  static exportAnalyticsToCSV(analyticsData, filename = 'analytics-export.csv') {
    const exportData = [{
      total_tickets: analyticsData.totalTickets,
      avg_sentiment: analyticsData.avgSentiment.toFixed(3),
      positive_tickets: analyticsData.sentimentBreakdown.positive,
      neutral_tickets: analyticsData.sentimentBreakdown.neutral,
      negative_tickets: analyticsData.sentimentBreakdown.negative,
      open_tickets: analyticsData.statusBreakdown.open,
      in_progress: analyticsData.statusBreakdown.in_progress,
      resolved: analyticsData.statusBreakdown.resolved,
      closed: analyticsData.statusBreakdown.closed,
      urgent_priority: analyticsData.priorityBreakdown.urgent,
      high_priority: analyticsData.priorityBreakdown.high,
      medium_priority: analyticsData.priorityBreakdown.medium,
      low_priority: analyticsData.priorityBreakdown.low
    }];

    this.exportToCSV(exportData, filename);
  }

  static exportCSRPerformanceToCSV(performanceData, filename = 'csr-performance.csv') {
    const exportData = performanceData.map(perf => ({
      csr_name: perf.csr?.name || 'Unknown',
      csr_email: perf.csr?.email || '',
      period_start: perf.period_start,
      period_end: perf.period_end,
      tickets_handled: perf.tickets_handled,
      avg_resolution_time: perf.avg_resolution_time || '',
      avg_response_time: perf.avg_response_time || '',
      customer_satisfaction: perf.customer_satisfaction?.toFixed(2) || '',
      quality_score: perf.quality_score ? (perf.quality_score * 100).toFixed(1) + '%' : ''
    }));

    this.exportToCSV(exportData, filename);
  }

  static exportForecastToCSV(forecasts, filename = 'forecast-export.csv') {
    const exportData = forecasts.map(forecast => ({
      forecast_date: forecast.forecast_date,
      predicted_volume: forecast.predicted_volume,
      confidence_level: (forecast.confidence_level * 100).toFixed(1) + '%',
      actual_volume: forecast.actual_volume || '',
      variance: forecast.actual_volume !== null
        ? (forecast.predicted_volume - forecast.actual_volume)
        : '',
      day_of_week: forecast.factors?.day_of_week || '',
      trend_adjustment: forecast.factors?.trend_adjustment || ''
    }));

    this.exportToCSV(exportData, filename);
  }

  static exportKBArticlesToCSV(articles, filename = 'kb-articles.csv') {
    const exportData = articles.map(article => ({
      title: article.title,
      category: article.category,
      tags: article.tags.join('; '),
      author: article.author?.name || 'Unknown',
      view_count: article.view_count,
      helpful_count: article.helpful_count,
      not_helpful_count: article.not_helpful_count,
      helpfulness_rate: article.helpful_count + article.not_helpful_count > 0
        ? ((article.helpful_count / (article.helpful_count + article.not_helpful_count)) * 100).toFixed(1) + '%'
        : 'N/A',
      published: article.published ? 'Yes' : 'No',
      created_at: article.created_at
    }));

    this.exportToCSV(exportData, filename);
  }

  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static generateReportHTML(title, sections) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
            background: #f5f5f5;
          }
          .report-header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .report-section {
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 { color: #111827; margin: 0 0 10px 0; }
          h2 { color: #374151; margin: 0 0 20px 0; }
          .meta { color: #6b7280; font-size: 14px; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f9fafb;
            font-weight: 600;
          }
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          .stat-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
          }
          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #111827;
          }
          .stat-label {
            color: #6b7280;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>${title}</h1>
          <div class="meta">Generated on ${new Date().toLocaleString()}</div>
        </div>
        ${sections.map(section => `
          <div class="report-section">
            <h2>${section.title}</h2>
            ${section.content}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    return html;
  }

  static exportReportToPDF(title, sections) {
    const html = this.generateReportHTML(title, sections);
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
    setTimeout(() => {
      newWindow.print();
    }, 500);
  }
}
