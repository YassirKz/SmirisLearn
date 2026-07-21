import assert from 'node:assert/strict';
import test from 'node:test';

import { formatError } from './errorFormatter.js';

test('formatError returns a normalized fallback for empty errors', () => {
  assert.deepEqual(formatError(null), {
    message: 'Erreur inconnue',
    code: 'UNKNOWN',
    details: null,
    original: null,
  });
});

test('formatError preserves useful fields from Supabase-like errors', () => {
  const original = {
    message: 'Forbidden',
    code: '42501',
    hint: 'Check RLS policy',
  };

  assert.deepEqual(formatError(original), {
    message: 'Forbidden',
    code: '42501',
    details: 'Check RLS policy',
    original,
  });
});

test('formatError converts primitive errors', () => {
  assert.deepEqual(formatError('boom'), {
    message: 'boom',
    code: 'UNKNOWN',
    details: null,
    original: 'boom',
  });
});
