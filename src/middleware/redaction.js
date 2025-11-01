const PII_PATTERNS = [
  { pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: '[REDACTED_EMAIL]' },
  { pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, replacement: '[REDACTED_SSN]' },
  { pattern: /\b(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[REDACTED_PHONE]' },
  { pattern: /\b\d{13,19}\b/g, replacement: '[REDACTED_CARD]' },
  { pattern: /\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g, replacement: '[REDACTED_CARD]' }
];

function redactText(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return text;
  }

  return PII_PATTERNS.reduce((acc, { pattern, replacement }) => acc.replace(pattern, replacement), text);
}

function scrubMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  const result = Array.isArray(metadata) ? [] : {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      result[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      result[key] = redactText(value);
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value.map(item => (typeof item === 'string' ? redactText(item) : scrubMetadata(item)));
      continue;
    }

    result[key] = scrubMetadata(value);
  }

  return result;
}

export function redactTranscriptRecord(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('Transcript record must be an object');
  }

  const messages = Array.isArray(record.messages)
    ? record.messages.map(message => ({
        ...message,
        text: redactText(message.text || ''),
        metadata: scrubMetadata(message.metadata || {})
      }))
    : [];

  return {
    ...record,
    subject: redactText(record.subject || ''),
    summary: redactText(record.summary || ''),
    key_issues: Array.isArray(record.key_issues)
      ? record.key_issues.map(issue => redactText(issue))
      : record.key_issues,
    metadata: scrubMetadata(record.metadata || {}),
    messages
  };
}

export { redactText };
