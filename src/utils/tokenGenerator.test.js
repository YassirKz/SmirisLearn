import assert from 'node:assert/strict';
import test from 'node:test';

import {
  generateInvitationToken,
  getExpirationDate,
  isTokenExpired,
  isValidToken,
} from './tokenGenerator.js';

test('generateInvitationToken creates a valid INV token', () => {
  const token = generateInvitationToken();

  assert.match(token, /^INV_[a-f0-9]{64}$/);
  assert.equal(isValidToken(token), true);
});

test('isValidToken rejects malformed tokens', () => {
  assert.equal(isValidToken(''), false);
  assert.equal(isValidToken('INV_short'), false);
  assert.equal(isValidToken('BAD_12345678901234567890'), false);
});

test('getExpirationDate returns a date about 24 hours in the future', () => {
  const before = Date.now();
  const expiration = new Date(getExpirationDate()).getTime();
  const after = Date.now();

  assert.ok(expiration >= before + 23.9 * 60 * 60 * 1000);
  assert.ok(expiration <= after + 24.1 * 60 * 60 * 1000);
});

test('isTokenExpired detects past and future dates', () => {
  assert.equal(isTokenExpired(new Date(Date.now() - 1000).toISOString()), true);
  assert.equal(isTokenExpired(new Date(Date.now() + 1000).toISOString()), false);
});
