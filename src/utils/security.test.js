import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkRateLimit,
  escapeText,
  sanitizeUrlInput,
  validateEmail,
  validateInput,
} from './security.js';

test('escapeText neutralizes HTML-special characters', () => {
  assert.equal(
    escapeText('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
  );
});

test('validateEmail trims and normalizes valid email addresses', () => {
  assert.equal(validateEmail('  USER@Example.COM  '), 'user@example.com');
});

test('validateEmail rejects invalid email addresses', () => {
  assert.throws(() => validateEmail('not-an-email'), /email invalide/i);
});

test('sanitizeUrlInput removes traversal and unsafe characters', () => {
  assert.equal(sanitizeUrlInput('../folder/report final.pdf'), 'folderreportfinalpdf');
});

test('checkRateLimit blocks attempts above the configured limit', () => {
  const identifier = `user-${Date.now()}-${Math.random()}`;

  assert.equal(checkRateLimit('login-test', identifier, 2, 60_000), true);
  assert.equal(checkRateLimit('login-test', identifier, 2, 60_000), true);
  assert.equal(checkRateLimit('login-test', identifier, 2, 60_000), false);
});

test('validateInput returns sanitized values and field errors', () => {
  const result = validateInput(
    {
      email: { required: true, type: 'email' },
      name: { required: true, type: 'text', minLength: 3 },
    },
    {
      email: 'Admin@Example.com',
      name: '<Al>',
    },
  );

  assert.equal(result.isValid, true);
  assert.equal(result.sanitized.email, 'admin@example.com');
  assert.equal(result.sanitized.name, '&lt;Al&gt;');
});
