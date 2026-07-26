import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>),
    label: React.forwardRef(({ children, ...props }, ref) => <label ref={ref} {...props}>{children}</label>),
    p: React.forwardRef(({ children, ...props }, ref) => <p ref={ref} {...props}>{children}</p>),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  AlertCircle: (props) => <svg data-testid="icon-alert" {...props} />,
  Eye: (props) => <svg data-testid="icon-eye" {...props} />,
  EyeOff: (props) => <svg data-testid="icon-eye-off" {...props} />,
  CheckCircle: (props) => <svg data-testid="icon-check" {...props} />,
}));

// Mock useTheme
vi.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Import after mocks
const { default: SanitizedInput } = await import('../../../components/ui/SanitizedInput');

describe('SanitizedInput', () => {
  it('rend le label correctement', () => {
    render(<SanitizedInput label="Email" />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('rend l\'astérisque pour les champs requis', () => {
    render(<SanitizedInput label="Email" required />);
    expect(screen.getByText('*')).toBeTruthy();
  });

  it('rend le champ input', () => {
    render(<SanitizedInput label="Nom" placeholder="Votre nom" />);
    expect(screen.getByPlaceholderText('Votre nom')).toBeTruthy();
  });

  it('appelle onChange quand l\'utilisateur tape', () => {
    const onChange = vi.fn();
    render(<SanitizedInput label="Nom" value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(onChange).toHaveBeenCalled();
  });

  // ── Validation email ──
  describe('validation email', () => {
    it('n\'affiche pas d\'erreur pour un email valide après blur', () => {
      render(<SanitizedInput label="Email" value="test@example.com" validate="email" />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.blur(input);

      expect(screen.queryByText("Format d'email invalide")).toBeNull();
    });

    it('affiche une erreur pour un email invalide après blur', () => {
      render(<SanitizedInput label="Email" value="" validate="email" />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.blur(input);

      expect(screen.getByText("Format d'email invalide")).toBeTruthy();
    });
  });

  // ── Icônes de validation ──
  describe('icônes de validation', () => {
    it('affiche l\'icône CheckCircle pour un champ valide après blur', () => {
      render(<SanitizedInput label="Email" value="test@example.com" validate="email" />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.blur(input);

      expect(screen.getByTestId('icon-check')).toBeTruthy();
    });

    it('affiche l\'icône AlertCircle pour un champ avec erreur après blur', () => {
      render(<SanitizedInput label="Email" value="" validate="email" />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'bad' } });
      fireEvent.blur(input);

      expect(screen.getAllByTestId('icon-alert').length).toBeGreaterThan(0);
    });
  });

  // ── Affichage erreur externe ──
  it('affiche une erreur externe', () => {
    render(<SanitizedInput label="Email" error="Ce champ est requis" />);
    expect(screen.getByText('Ce champ est requis')).toBeTruthy();
  });

  // ── Validation longueur ──
  it('affiche une erreur de longueur minimale', () => {
    render(<SanitizedInput label="Mot de passe" value="" minLength={8} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);

    expect(screen.getByText('Minimum 8 caractères')).toBeTruthy();
  });

  // ── Password toggle ──
  describe('toggle visibilité mot de passe', () => {
    it('rend le champ en type password par défaut', () => {
      const { container } = render(<SanitizedInput label="MDP" type="password" value="" />);
      const input = container.querySelector('input');
      expect(input.type).toBe('password');
    });

    it('affiche le bouton toggle pour les champs password', () => {
      render(<SanitizedInput label="MDP" type="password" value="" />);
      // The Eye icon should be visible
      expect(screen.getByTestId('icon-eye')).toBeTruthy();
    });

    it('bascule en text quand on clique sur le toggle', () => {
      const { container } = render(<SanitizedInput label="MDP" type="password" value="" />);
      const toggleBtn = container.querySelector('button[type="button"]');

      fireEvent.click(toggleBtn);

      const input = container.querySelector('input');
      expect(input.type).toBe('text');
      expect(screen.getByTestId('icon-eye-off')).toBeTruthy();
    });

    it('rebascule en password au second clic', () => {
      const { container } = render(<SanitizedInput label="MDP" type="password" value="" />);
      const toggleBtn = container.querySelector('button[type="button"]');

      fireEvent.click(toggleBtn);
      fireEvent.click(toggleBtn);

      const input = container.querySelector('input');
      expect(input.type).toBe('password');
    });
  });

  // ── Pas de toggle pour les champs non-password ──
  it('n\'affiche pas le toggle pour les champs text', () => {
    render(<SanitizedInput label="Nom" type="text" value="" />);
    expect(screen.queryByTestId('icon-eye')).toBeNull();
  });
});
