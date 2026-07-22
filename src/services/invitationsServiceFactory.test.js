import assert from 'node:assert/strict';
import test from 'node:test';

import { createInvitationsService } from './invitationsServiceFactory.js';

function createQuery(table, calls) {
  const query = {
    table,
    payload: null,
    selectColumns: null,
    filters: [],
    select(columns) {
      this.selectColumns = columns;
      return this;
    },
    eq(column, value) {
      this.filters.push({ column, value });
      return this;
    },
    insert(payload) {
      this.payload = payload;
      return this;
    },
    single() {
      calls.push({ method: 'single', query: this });
      return this;
    },
    maybeSingle() {
      calls.push({ method: 'maybeSingle', query: this });
      return this;
    },
  };

  return query;
}

function createHarness({
  rateLimitAllowed = true,
  executeResults = [],
  rpcResult = { data: null, error: null },
  emailResult = { success: true },
} = {}) {
  const calls = {
    queries: [],
    rpc: [],
    emails: [],
    warnings: [],
  };

  const supabase = {
    from(table) {
      return createQuery(table, calls.queries);
    },
    async rpc(name, params) {
      calls.rpc.push({ name, params });
      return rpcResult;
    },
  };

  const service = createInvitationsService({
    supabase,
    executeSupabase: async (statement, label) => {
      calls.queries.push({ method: 'execute', label, statement });
      return executeResults.shift() ?? { data: null, error: null };
    },
    generateInvitationToken: () => 'INV_test_token_1234567890',
    getExpirationDate: () => '2030-01-01T00:00:00.000Z',
    checkRateLimit: () => rateLimitAllowed,
    untrusted: (value) => value,
    validateEmail: (value) => String(value).trim().toLowerCase(),
    sendInvitationEmail: async (payload) => {
      calls.emails.push(payload);
      return emailResult;
    },
    logger: {
      warn: (...args) => calls.warnings.push(args),
    },
  });

  return { calls, service };
}

test('createMemberInvitation creates an invitation and sends a member email', async () => {
  const { calls, service } = createHarness({
    executeResults: [
      { data: { name: 'Smiris Org' }, error: null },
      { data: { full_name: 'Admin User' }, error: null },
      { data: null, error: null },
      { data: { id: 'invitation-1' }, error: null },
    ],
  });

  const result = await service.createMemberInvitation({
    email: '  MEMBER@Example.COM ',
    role: 'student',
    organization_id: 'org-1',
    invited_by: 'admin-1',
  });

  assert.equal(result.error, undefined);
  assert.deepEqual(result.invitation, { id: 'invitation-1' });
  assert.equal(result.alreadyExisted, false);
  assert.equal(calls.emails.length, 1);
  assert.deepEqual(calls.emails[0], {
    to: 'member@example.com',
    type: 'member',
    organizationName: 'Smiris Org',
    invitedByName: 'Admin User',
    token: 'INV_test_token_1234567890',
  });
});

test('createMemberInvitation stops when rate limit is exceeded', async () => {
  const { calls, service } = createHarness({ rateLimitAllowed: false });

  const result = await service.createMemberInvitation({
    email: 'member@example.com',
    role: 'student',
    organization_id: 'org-1',
    invited_by: 'admin-1',
  });

  assert.match(result.error.message, /tentatives/i);
  assert.equal(calls.queries.length, 0);
  assert.equal(calls.emails.length, 0);
});

test('createMemberInvitation rejects users already attached to an organization', async () => {
  const { calls, service } = createHarness({
    executeResults: [
      { data: { name: 'Smiris Org' }, error: null },
      { data: { full_name: 'Admin User' }, error: null },
      { data: { id: 'user-1', organization_id: 'org-other' }, error: null },
    ],
  });

  const result = await service.createMemberInvitation({
    email: 'member@example.com',
    role: 'student',
    organization_id: 'org-1',
    invited_by: 'admin-1',
  });

  assert.match(result.error.message, /organisation/i);
  assert.equal(calls.emails.length, 0);
});

test('createMemberInvitation keeps invitation when email sending fails', async () => {
  const { calls, service } = createHarness({
    executeResults: [
      { data: { name: 'Smiris Org' }, error: null },
      { data: { full_name: 'Admin User' }, error: null },
      { data: null, error: null },
      { data: { id: 'invitation-1' }, error: null },
    ],
    emailResult: { success: false, error: 'email failed' },
  });

  const result = await service.createMemberInvitation({
    email: 'member@example.com',
    role: 'student',
    organization_id: 'org-1',
    invited_by: 'admin-1',
  });

  assert.deepEqual(result.invitation, { id: 'invitation-1' });
  assert.equal(calls.warnings.length, 1);
});

test('getInvitationByToken unwraps the first RPC row', async () => {
  const { calls, service } = createHarness({
    rpcResult: { data: [{ id: 'inv-1', email: 'member@example.com' }], error: null },
  });

  const result = await service.getInvitationByToken('INV_token');

  assert.deepEqual(result.data, { id: 'inv-1', email: 'member@example.com' });
  assert.deepEqual(calls.rpc[0], {
    name: 'get_member_invitation_by_token',
    params: { p_token: 'INV_token' },
  });
});

test('acceptMemberInvitation trims full name before RPC', async () => {
  const { calls, service } = createHarness();

  const result = await service.acceptMemberInvitation('INV_token', 'user-1', '  New Member  ');

  assert.deepEqual(result, { success: true });
  assert.deepEqual(calls.rpc[0], {
    name: 'accept_member_invitation',
    params: {
      p_token: 'INV_token',
      p_user_id: 'user-1',
      p_full_name: 'New Member',
    },
  });
}
);
