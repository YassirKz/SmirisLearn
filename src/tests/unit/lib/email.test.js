import { describe, it, expect, vi, beforeEach } from 'vitest';
import emailjs from '@emailjs/browser';

// Mock emailjs
vi.mock('@emailjs/browser', () => ({
  default: {
    init: vi.fn(),
    send: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../../lib/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Set up required env variables before importing the module
vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', 'pk_test_123');
vi.stubEnv('VITE_EMAILJS_SERVICE_ID', 'svc_test_123');
vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 'tpl_company_123');
vi.stubEnv('VITE_EMAILJS_MEMBER_TEMPLATE_ID', 'tpl_member_123');

// Dynamic import so env stubs are in place
const { sendInvitationEmail } = await import('../../../lib/email');

describe('sendInvitationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: emailjs.send resolves successfully
    emailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://app.smiris.com' },
      writable: true,
    });
  });

  // ── Member invitation ──
  describe('type = member', () => {
    it('construit le lien d\'invitation member correct', async () => {
      await sendInvitationEmail({
        to: 'user@example.com',
        type: 'member',
        organizationName: 'ACME',
        invitedByName: 'Admin',
        token: 'INV_abc123',
      });

      expect(emailjs.send).toHaveBeenCalledWith(
        'svc_test_123',
        'tpl_member_123',
        expect.objectContaining({
          to_email: 'user@example.com',
          organization_name: 'ACME',
          invited_by: 'Admin',
          invite_link: 'https://app.smiris.com/accept-member-invite?token=INV_abc123',
        })
      );
    });

    it('utilise "Un administrateur" si invitedByName est absent', async () => {
      await sendInvitationEmail({
        to: 'user@example.com',
        type: 'member',
        organizationName: 'ACME',
        token: 'INV_abc',
      });

      expect(emailjs.send).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ invited_by: 'Un administrateur' })
      );
    });

    it('retourne {success: true, data} en cas de succès', async () => {
      const result = await sendInvitationEmail({
        to: 'user@example.com',
        type: 'member',
        organizationName: 'ACME',
        token: 'INV_abc',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  // ── Company invitation ──
  describe('type = company (default)', () => {
    it('construit le lien d\'invitation company correct', async () => {
      await sendInvitationEmail({
        to: 'admin@company.com',
        organizationName: 'NewCo',
        fromEmail: 'noreply@smiris.com',
        fromName: 'Smiris Learn',
        adminName: 'Boss',
        token: 'INV_xyz',
      });

      expect(emailjs.send).toHaveBeenCalledWith(
        'svc_test_123',
        'tpl_company_123',
        expect.objectContaining({
          to_email: 'admin@company.com',
          companyName: 'NewCo',
          inviteLink: 'https://app.smiris.com/accept-invite?token=INV_xyz',
          from_name: 'Smiris Learn',
          from_email: 'noreply@smiris.com',
          adminName: 'Boss',
        })
      );
    });

    it('utilise "Smiris Learn" comme fromName par défaut', async () => {
      await sendInvitationEmail({
        to: 'admin@company.com',
        fromEmail: 'noreply@smiris.com',
        token: 'INV_xyz',
      });

      expect(emailjs.send).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ from_name: 'Smiris Learn' })
      );
    });
  });

  // ── Error handling ──
  describe('gestion des erreurs', () => {
    it('retourne {success: false} en cas d\'erreur réseau', async () => {
      emailjs.send.mockRejectedValue(new Error('Network error'));

      const result = await sendInvitationEmail({
        to: 'user@example.com',
        type: 'member',
        organizationName: 'ACME',
        token: 'INV_abc',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('gère les erreurs emailjs avec .text', async () => {
      emailjs.send.mockRejectedValue({ text: 'Invalid template', message: 'fail' });

      const result = await sendInvitationEmail({
        to: 'user@example.com',
        type: 'member',
        organizationName: 'ACME',
        token: 'INV_abc',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid template');
    });

    it('lève une erreur si to_email est vide', async () => {
      const result = await sendInvitationEmail({
        to: '',
        type: 'member',
        organizationName: 'ACME',
        token: 'INV_abc',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('to_email');
    });
  });
});
