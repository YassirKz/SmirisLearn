import { describe, it, expect, vi } from 'vitest';
import { createInvitationsService } from '../../../services/invitationsServiceFactory';

// ═══════════════════════════════════════════════
// We test the factory directly — no module mocking needed.
// Each test creates a fresh service with controlled stubs.
// ═══════════════════════════════════════════════

function createMockDeps(overrides = {}) {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    rpc: vi.fn(),
  };

  // Make chainable
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);

  return {
    supabase: mockSupabase,
    executeSupabase: vi.fn(),
    generateInvitationToken: vi.fn(() => 'INV_testtoken123456789abcdef0123456789abcdef0123456789abcdef01234567'),
    getExpirationDate: vi.fn(() => '2025-07-01T12:00:00.000Z'),
    checkRateLimit: vi.fn(() => true),
    untrusted: vi.fn((v) => v),
    validateEmail: vi.fn((e) => String(e).trim().toLowerCase()),
    sendInvitationEmail: vi.fn(async () => ({ success: true })),
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    ...overrides,
  };
}

// ═══════════════════════════════════════════════
// createMemberInvitation
// ═══════════════════════════════════════════════
describe('createMemberInvitation', () => {
  it('crée une invitation avec succès', async () => {
    const deps = createMockDeps();
    const invitationData = { id: 'inv-1', email: 'test@example.com' };

    // executeSupabase returns org, inviter, no existing profile, then insert
    deps.executeSupabase
      .mockResolvedValueOnce({ data: { name: 'ACME Corp' }, error: null })   // org
      .mockResolvedValueOnce({ data: { full_name: 'Admin' }, error: null })  // inviter
      .mockResolvedValueOnce({ data: null, error: null })                    // no existing profile
      .mockResolvedValueOnce({ data: invitationData, error: null });         // insert

    const service = createInvitationsService(deps);
    const result = await service.createMemberInvitation({
      email: 'test@example.com',
      role: 'member',
      organization_id: 'org-1',
      invited_by: 'admin-1',
    });

    expect(result.invitation).toEqual(invitationData);
    expect(result.error).toBeUndefined();
    expect(deps.sendInvitationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        type: 'member',
        organizationName: 'ACME Corp',
        invitedByName: 'Admin',
      })
    );
  });

  it('bloque si le rate limit est dépassé', async () => {
    const deps = createMockDeps({ checkRateLimit: vi.fn(() => false) });
    const service = createInvitationsService(deps);

    const result = await service.createMemberInvitation({
      email: 'test@example.com',
      role: 'member',
      organization_id: 'org-1',
      invited_by: 'admin-1',
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('Trop de tentatives');
    expect(deps.executeSupabase).not.toHaveBeenCalled();
  });

  it('retourne une erreur si l\'email est déjà rattaché à une organisation', async () => {
    const deps = createMockDeps();
    deps.executeSupabase
      .mockResolvedValueOnce({ data: { name: 'ACME' }, error: null })
      .mockResolvedValueOnce({ data: { full_name: 'Admin' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'u1', organization_id: 'org-other' }, error: null });

    const service = createInvitationsService(deps);
    const result = await service.createMemberInvitation({
      email: 'existing@example.com',
      role: 'member',
      organization_id: 'org-1',
      invited_by: 'admin-1',
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('deja rattache');
  });

  it('retourne une erreur si l\'organisation est introuvable', async () => {
    const deps = createMockDeps();
    deps.executeSupabase
      .mockResolvedValueOnce({ data: null, error: new Error('Not found') })
      .mockResolvedValueOnce({ data: { full_name: 'Admin' }, error: null });

    const service = createInvitationsService(deps);
    const result = await service.createMemberInvitation({
      email: 'test@example.com',
      role: 'member',
      organization_id: 'org-missing',
      invited_by: 'admin-1',
    });

    expect(result.error).toBeDefined();
  });

  it('retourne l\'invitation même si l\'envoi d\'email échoue (avec warning)', async () => {
    const deps = createMockDeps();
    deps.sendInvitationEmail.mockResolvedValue({ success: false, error: 'SMTP error' });
    deps.executeSupabase
      .mockResolvedValueOnce({ data: { name: 'ACME' }, error: null })
      .mockResolvedValueOnce({ data: { full_name: 'Admin' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: 'inv-2' }, error: null });

    const service = createInvitationsService(deps);
    const result = await service.createMemberInvitation({
      email: 'test@example.com',
      role: 'member',
      organization_id: 'org-1',
      invited_by: 'admin-1',
    });

    expect(result.invitation).toBeDefined();
    expect(deps.logger.warn).toHaveBeenCalled();
  });

  it('indique alreadyExisted si le profil existe sans organisation', async () => {
    const deps = createMockDeps();
    deps.executeSupabase
      .mockResolvedValueOnce({ data: { name: 'ACME' }, error: null })
      .mockResolvedValueOnce({ data: { full_name: 'Admin' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'u1', organization_id: null }, error: null }) // exists but no org
      .mockResolvedValueOnce({ data: { id: 'inv-3' }, error: null });

    const service = createInvitationsService(deps);
    const result = await service.createMemberInvitation({
      email: 'orphan@example.com',
      role: 'member',
      organization_id: 'org-1',
      invited_by: 'admin-1',
    });

    expect(result.invitation).toBeDefined();
    expect(result.alreadyExisted).toBe(true);
  });
});

// ═══════════════════════════════════════════════
// getInvitationByToken
// ═══════════════════════════════════════════════
describe('getInvitationByToken', () => {
  it('retourne l\'invitation si le token est valide', async () => {
    const invData = { id: 'inv-1', email: 'test@example.com', token: 'INV_abc' };
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({ data: [invData], error: null });

    const service = createInvitationsService(deps);
    const result = await service.getInvitationByToken('INV_abc');

    expect(result.data).toEqual(invData);
    expect(deps.supabase.rpc).toHaveBeenCalledWith('get_member_invitation_by_token', { p_token: 'INV_abc' });
  });

  it('retourne null si le token ne correspond à aucune invitation', async () => {
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({ data: [], error: null });

    const service = createInvitationsService(deps);
    const result = await service.getInvitationByToken('INV_invalid');

    expect(result.data).toBeNull();
  });

  it('retourne une erreur si le RPC échoue', async () => {
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const service = createInvitationsService(deps);
    const result = await service.getInvitationByToken('INV_abc');

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('DB error');
  });

  it('gère un résultat non-array (objet unique)', async () => {
    const invData = { id: 'inv-1', email: 'test@example.com' };
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({ data: invData, error: null });

    const service = createInvitationsService(deps);
    const result = await service.getInvitationByToken('INV_abc');

    expect(result.data).toEqual(invData);
  });
});

// ═══════════════════════════════════════════════
// acceptMemberInvitation
// ═══════════════════════════════════════════════
describe('acceptMemberInvitation', () => {
  it('appelle le RPC avec les bons paramètres', async () => {
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({ error: null });

    const service = createInvitationsService(deps);
    const result = await service.acceptMemberInvitation('INV_abc', 'user-123', 'John Doe');

    expect(deps.supabase.rpc).toHaveBeenCalledWith('accept_member_invitation', {
      p_token: 'INV_abc',
      p_user_id: 'user-123',
      p_full_name: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('trim le fullName', async () => {
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({ error: null });

    const service = createInvitationsService(deps);
    await service.acceptMemberInvitation('INV_abc', 'user-123', '  John Doe  ');

    expect(deps.supabase.rpc).toHaveBeenCalledWith('accept_member_invitation', {
      p_token: 'INV_abc',
      p_user_id: 'user-123',
      p_full_name: 'John Doe',
    });
  });

  it('passe null pour fullName si non fourni', async () => {
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({ error: null });

    const service = createInvitationsService(deps);
    await service.acceptMemberInvitation('INV_abc', 'user-123');

    expect(deps.supabase.rpc).toHaveBeenCalledWith('accept_member_invitation', {
      p_token: 'INV_abc',
      p_user_id: 'user-123',
      p_full_name: null,
    });
  });

  it('retourne une erreur si le RPC échoue (401)', async () => {
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({
      error: { message: 'Unauthorized', code: '401' },
    });

    const service = createInvitationsService(deps);
    const result = await service.acceptMemberInvitation('INV_abc', 'user-123');

    expect(result.error).toBeDefined();
    expect(result.success).toBeUndefined();
  });

  it('retourne une erreur si le RPC échoue (404 - token introuvable)', async () => {
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({
      error: { message: 'Invitation not found', code: '404' },
    });

    const service = createInvitationsService(deps);
    const result = await service.acceptMemberInvitation('INV_unknown', 'user-123');

    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('not found');
  });

  it('retourne une erreur si le token est expiré', async () => {
    const deps = createMockDeps();
    deps.supabase.rpc.mockResolvedValue({
      error: { message: 'Invitation expired' },
    });

    const service = createInvitationsService(deps);
    const result = await service.acceptMemberInvitation('INV_expired', 'user-123');

    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('expired');
  });
});
