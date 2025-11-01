export type ReportNote = {
  id: string;
  reportId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateNoteInput = {
  content: string;
  author?: string;
};

export type UpdateNoteInput = {
  content?: string;
};

interface StorageDriver {
  read(): Record<string, ReportNote[]>;
  write(payload: Record<string, ReportNote[]>): void;
}

class LocalStorageDriver implements StorageDriver {
  private readonly storageKey = 'report-notes';

  read(): Record<string, ReportNote[]> {
    try {
      const raw = globalThis.localStorage?.getItem(this.storageKey);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as Record<string, ReportNote[]>;
      return parsed;
    } catch (error) {
      console.warn('Failed to parse report notes from storage, resetting.', error);
      return {};
    }
  }

  write(payload: Record<string, ReportNote[]>): void {
    if (!globalThis.localStorage) {
      return;
    }
    globalThis.localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }
}

class MemoryStorageDriver implements StorageDriver {
  private state: Record<string, ReportNote[]> = {};

  read(): Record<string, ReportNote[]> {
    return this.state;
  }

  write(payload: Record<string, ReportNote[]>): void {
    this.state = payload;
  }
}

const storageDriver: StorageDriver = typeof localStorage !== 'undefined'
  ? new LocalStorageDriver()
  : new MemoryStorageDriver();

const ensureContentValid = (content: string | undefined): string => {
  const trimmed = content?.trim() ?? '';
  if (!trimmed) {
    throw new Error('Note content is required.');
  }
  if (trimmed.length > 2000) {
    throw new Error('Note content exceeds the maximum length of 2000 characters.');
  }
  return trimmed;
};

const ensureAuthor = (author: string | undefined): string => {
  const trimmed = author?.trim() ?? '';
  if (trimmed.length === 0) {
    return 'System';
  }
  if (trimmed.length > 120) {
    throw new Error('Author name exceeds the maximum length of 120 characters.');
  }
  return trimmed;
};

const clone = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const buildIndexKey = (reportId: string): string => {
  const trimmed = reportId.trim();
  if (!trimmed) {
    throw new Error('reportId is required to manage report notes.');
  }
  return trimmed;
};

export const reportNotesService = {
  async list(reportId: string): Promise<ReportNote[]> {
    const key = buildIndexKey(reportId);
    const snapshot = storageDriver.read();
    return clone(snapshot[key] ?? []);
  },

  async create(reportId: string, input: CreateNoteInput): Promise<ReportNote> {
    const key = buildIndexKey(reportId);
    const content = ensureContentValid(input.content);
    const author = ensureAuthor(input.author);

    const snapshot = storageDriver.read();
    const collection = clone(snapshot);

    const now = new Date().toISOString();
    const note: ReportNote = {
      id: crypto.randomUUID(),
      reportId: key,
      content,
      author,
      createdAt: now,
      updatedAt: now
    };

    const nextCollection = collection[key] ? [...collection[key], note] : [note];
    collection[key] = nextCollection;
    storageDriver.write(collection);

    return clone(note);
  },

  async update(reportId: string, noteId: string, input: UpdateNoteInput): Promise<ReportNote> {
    const key = buildIndexKey(reportId);
    const snapshot = storageDriver.read();
    const collection = clone(snapshot[key] ?? []);
    const index = collection.findIndex((note) => note.id === noteId);

    if (index === -1) {
      throw new Error('Note not found.');
    }

    const current = collection[index];
    const nextContent = input.content !== undefined ? ensureContentValid(input.content) : current.content;

    const updated: ReportNote = {
      ...current,
      content: nextContent,
      updatedAt: new Date().toISOString()
    };

    const globalSnapshot = clone(snapshot);
    globalSnapshot[key] = collection.map((note, idx) => (idx === index ? updated : note));
    storageDriver.write(globalSnapshot);

    return clone(updated);
  },

  async remove(reportId: string, noteId: string): Promise<void> {
    const key = buildIndexKey(reportId);
    const snapshot = storageDriver.read();
    const collection = clone(snapshot[key] ?? []);

    const filtered = collection.filter((note) => note.id !== noteId);
    if (filtered.length === collection.length) {
      throw new Error('Note not found.');
    }

    const nextSnapshot = clone(snapshot);
    nextSnapshot[key] = filtered;
    storageDriver.write(nextSnapshot);
  }
};

export type ReportNotesService = typeof reportNotesService;
