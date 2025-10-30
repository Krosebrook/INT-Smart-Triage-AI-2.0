import '@testing-library/jest-dom';

// Polyfill structuredClone for jsdom if missing
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}
