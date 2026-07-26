import '@testing-library/jest-dom';

// Provide a minimal crypto.getRandomValues for token tests in jsdom
if (!globalThis.crypto?.getRandomValues) {
  const { webcrypto } = await import('node:crypto');
  globalThis.crypto = webcrypto;
}
