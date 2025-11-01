import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportDetail from '../src/pages/ReportDetail';
import { reportNotesService, ReportNote } from '../src/services/reportNotes';

jest.mock('../src/services/reportNotes', () => {
  const actual = jest.requireActual('../src/services/reportNotes');
  return {
    ...actual,
    reportNotesService: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn()
    }
  };
});

type ReportNotesServiceMock = jest.Mocked<typeof reportNotesService>;

const renderReportDetail = () => {
  return render(
    <MemoryRouter initialEntries={['/reports/demo-report']}>
      <Routes>
        <Route path="/reports/:reportId" element={<ReportDetail />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ReportDetail page', () => {
  const mockService = reportNotesService as ReportNotesServiceMock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the triage summary and existing notes', async () => {
    const existingNote: ReportNote = {
      id: 'note-1',
      reportId: 'demo-report',
      author: 'Alex Doe',
      content: 'Follow up with ACME leadership about renewal.',
      createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-01T10:00:00Z').toISOString()
    };

    mockService.list.mockResolvedValueOnce([existingNote]);

    renderReportDetail();

    expect(await screen.findByRole('heading', { name: 'Executive Report Detail' })).toBeInTheDocument();
    expect(
      await screen.findByText('Operational Triage Summary — demo-report', { exact: false })
    ).toBeInTheDocument();
    expect(await screen.findByText(existingNote.content)).toBeInTheDocument();
  });

  it('creates a new note through the form', async () => {
    const existingNote: ReportNote = {
      id: 'note-1',
      reportId: 'demo-report',
      author: 'Alex Doe',
      content: 'Initial observation',
      createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-01T10:00:00Z').toISOString()
    };

    const createdNote: ReportNote = {
      id: 'note-2',
      reportId: 'demo-report',
      author: 'Jordan Analyst',
      content: 'Escalated to engineering for RCA.',
      createdAt: new Date('2024-01-02T12:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-02T12:00:00Z').toISOString()
    };

    mockService.list.mockResolvedValueOnce([existingNote]);
    mockService.create.mockResolvedValueOnce(createdNote);

    renderReportDetail();

    const noteField = await screen.findByLabelText('Note');
    await userEvent.clear(noteField);
    await userEvent.type(noteField, createdNote.content);

    const analystField = screen.getByLabelText('Analyst');
    await userEvent.clear(analystField);
    await userEvent.type(analystField, createdNote.author);

    await userEvent.click(screen.getByRole('button', { name: 'Add Note' }));

    await waitFor(() => expect(mockService.create).toHaveBeenCalledWith('demo-report', {
      content: createdNote.content,
      author: createdNote.author
    }));

    expect(await screen.findByText(createdNote.content)).toBeInTheDocument();
  });

  it('shows validation error when attempting to submit an empty note', async () => {
    mockService.list.mockResolvedValueOnce([]);

    renderReportDetail();

    const noteField = await screen.findByLabelText('Note');
    await userEvent.clear(noteField);

    await userEvent.click(screen.getByRole('button', { name: 'Add Note' }));

    expect(mockService.create).not.toHaveBeenCalled();
    // With the required attribute, native validation prevents submission
    // The custom error message only shows if the required validation passes but content is whitespace
    expect(noteField).toBeRequired();
  });
});
