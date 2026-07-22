import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupabaseExecutor } from './supabaseExecutor.js';

function createLogger() {
  return {
    debugCalls: [],
    errorCalls: [],
    debug(...args) {
      this.debugCalls.push(args);
    },
    error(...args) {
      this.errorCalls.push(args);
    },
  };
}

test('executeSupabase retourne les donnees et la duree en cas de succes', async () => {
  const logger = createLogger();
  const executeSupabase = createSupabaseExecutor({
    logger,
    formatError: (error) => ({ message: error.message }),
    now: (() => {
      const values = [100, 132.6];
      return () => values.shift();
    })(),
  });

  const result = await executeSupabase(Promise.resolve({ data: [{ id: 1 }], count: 1 }), 'profiles');

  assert.deepEqual(result, { data: [{ id: 1 }], count: 1, duration: 33 });
  assert.equal(logger.errorCalls.length, 0);
  assert.equal(logger.debugCalls.length, 2);
});

test('executeSupabase formate les erreurs retournees par Supabase', async () => {
  const logger = createLogger();
  const formattedError = { message: 'Acces refuse', code: '42501' };
  const executeSupabase = createSupabaseExecutor({
    logger,
    formatError: () => formattedError,
    now: (() => {
      const values = [10, 15];
      return () => values.shift();
    })(),
  });

  const result = await executeSupabase(Promise.resolve({ data: null, error: { message: 'raw' } }), 'videos');

  assert.deepEqual(result, { data: null, error: formattedError, duration: 5 });
  assert.equal(logger.errorCalls.length, 1);
  assert.equal(logger.errorCalls[0][1], 'videos');
});

test('executeSupabase absorbe les erreurs inattendues', async () => {
  const logger = createLogger();
  const thrownError = new Error('Reseau indisponible');
  const formattedError = { message: 'Reseau indisponible', code: 'NETWORK' };
  const executeSupabase = createSupabaseExecutor({
    logger,
    formatError: (error) => {
      assert.equal(error, thrownError);
      return formattedError;
    },
    now: (() => {
      const values = [0, 8.4];
      return () => values.shift();
    })(),
  });

  const result = await executeSupabase(Promise.reject(thrownError), 'rpc:accept_invitation');

  assert.deepEqual(result, { data: null, error: formattedError, duration: 8 });
  assert.equal(logger.errorCalls.length, 1);
  assert.equal(logger.errorCalls[0][1], 'rpc:accept_invitation');
});
