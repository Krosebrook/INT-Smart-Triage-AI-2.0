import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import TriageSummary, { SummaryMetric, RiskIndicator } from '../components/TriageSummary';
import '../styles/report-detail.css';
import { reportNotesService, ReportNote } from '../services/reportNotes';

const DEFAULT_AUTHOR = 'Client Success Analyst';

const useReportSummary = (reportId: string) => {
  return useMemo(() => {
    const metrics: SummaryMetric[] = [
      {
        label: 'Open Tickets',
        value: 18,
        trend: 'down',
        helperText: 'Down 12% vs. last week'
      },
      {
        label: 'Critical Issues',
        value: 3,
        trend: 'flat',
        helperText: 'Monitor closely over next 24h'
      },
      {
        label: 'Avg. Response Time',
        value: '2h 15m',
        trend: 'up',
        helperText: 'SLA risk threshold at 3h'
      },
      {
        label: 'Satisfaction Score',
        value: '4.5 / 5',
        trend: 'up',
        helperText: 'Improved after workflow automation'
      }
    ];

    const risks: RiskIndicator[] = [
      {
        label: 'Renewal Risk',
        level: 'medium',
        description: 'Two enterprise accounts flagged for executive escalation.'
      },
      {
        label: 'Backlog Growth',
        level: 'low',
        description: 'Volume stabilized after last sprint improvements.'
      }
    ];

    const recommendations = [
      'Schedule proactive health review with ACME Corp leadership.',
      'Deploy automation on password-reset workflow to cut handle time by 25%.',
      'Activate weekend coverage pilot to absorb spike in LATAM requests.'
    ];

    return {
      title: `Operational Triage Summary — ${reportId}`,
      metrics,
      risks,
      recommendations
    };
  }, [reportId]);
};

const ReportDetail: React.FC = () => {
  const params = useParams<{ reportId: string }>();
  const reportId = params.reportId ?? 'unknown-report';
  const summary = useReportSummary(reportId);

  const [notes, setNotes] = useState<ReportNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState<string>(DEFAULT_AUTHOR);
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');

  const refreshNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportNotesService.list(reportId);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notes.');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    refreshNotes().catch((err) => {
      console.error('Failed to load report notes', err);
      setError(err instanceof Error ? err.message : 'Unable to load notes.');
      setLoading(false);
    });
  }, [refreshNotes]);

  const resetForm = () => {
    setContent('');
    setAuthor(DEFAULT_AUTHOR);
  };

  const handleCreateNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Please enter note content before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const note = await reportNotesService.create(reportId, { content, author });
      setNotes((prev) => [...prev, note]);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRequest = (note: ReportNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleUpdateNote = async (noteId: string) => {
    setError(null);
    if (!editingContent.trim()) {
      setError('Updated note content cannot be empty.');
      return;
    }

    try {
      const updated = await reportNotesService.update(reportId, noteId, { content: editingContent });
      setNotes((prev) => prev.map((note) => (note.id === noteId ? updated : note)));
      handleCancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setError(null);
    try {
      await reportNotesService.remove(reportId, noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note.');
    }
  };

  return (
    <main className="report-detail" aria-live="polite">
      <header className="report-detail__header">
        <div>
          <h1>Executive Report Detail</h1>
          <p className="report-detail__subtitle">
            Operational and customer health summary for report <strong>{reportId}</strong>.
          </p>
        </div>
        <span className="report-detail__status" role="status">
          Status: <strong>Monitoring</strong>
        </span>
      </header>

      <TriageSummary
        title={summary.title}
        metrics={summary.metrics}
        risks={summary.risks}
        recommendations={summary.recommendations}
      />

      <section className="report-detail__notes" aria-labelledby="report-notes-heading">
        <div className="report-detail__notes-header">
          <h2 id="report-notes-heading">Analyst Notes</h2>
          <p>Track investigations, escalations, and proactive outreach in one place.</p>
        </div>

        <form className="report-detail__form" onSubmit={handleCreateNote}>
          <label className="report-detail__label" htmlFor="note-author">
            Analyst
          </label>
          <input
            id="note-author"
            name="author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Who is adding this note?"
            autoComplete="name"
          />

          <label className="report-detail__label" htmlFor="note-content">
            Note
          </label>
          <textarea
            id="note-content"
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Summarize the insight, escalation, or next action"
            rows={3}
            required
            />

          <button type="submit" className="report-detail__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Add Note'}
          </button>
        </form>

        {error ? (
          <div role="alert" className="report-detail__error">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="report-detail__loading">Loading notes…</p>
        ) : notes.length === 0 ? (
          <p className="report-detail__empty">No notes yet. Start the documentation above.</p>
        ) : (
          <ul className="report-detail__notes-list">
            {notes.map((note) => (
              <li key={note.id} className="report-detail__note-item">
                <header className="report-detail__note-header">
                  <div>
                    <strong>{note.author}</strong>
                    <time dateTime={note.updatedAt}>
                      {new Date(note.updatedAt).toLocaleString()}
                    </time>
                  </div>
                  <div className="report-detail__note-actions">
                    <button type="button" onClick={() => handleEditRequest(note)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteNote(note.id)}>
                      Delete
                    </button>
                  </div>
                </header>
                {editingNoteId === note.id ? (
                  <div className="report-detail__note-edit">
                    <textarea
                      value={editingContent}
                      onChange={(event) => setEditingContent(event.target.value)}
                      rows={3}
                      aria-label="Edit note content"
                    />
                    <div className="report-detail__note-edit-actions">
                      <button type="button" onClick={() => handleUpdateNote(note.id)}>
                        Save
                      </button>
                      <button type="button" onClick={handleCancelEdit} className="secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="report-detail__note-content">{note.content}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default ReportDetail;
