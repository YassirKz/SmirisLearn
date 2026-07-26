import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock framer-motion to render regular divs (avoids animation complexities in tests)
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>),
    p: React.forwardRef(({ children, ...props }, ref) => <p ref={ref} {...props}>{children}</p>),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: (props) => <svg data-testid="icon-loader2" {...props} />,
  Sparkles: (props) => <svg data-testid="icon-sparkles" {...props} />,
  Shield: (props) => <svg data-testid="icon-shield" {...props} />,
  Zap: (props) => <svg data-testid="icon-zap" {...props} />,
}));

// Import after mocks
const { default: LoadingSpinner, FullPageSpinner, ProgressSpinner } = await import('../../../components/ui/LoadingSpinner');

describe('LoadingSpinner', () => {
  it('rend le spinner sans erreur', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it('applique la classe de taille md par défaut', () => {
    const { container } = render(<LoadingSpinner />);
    // md = "w-8 h-8"
    const sizedEl = container.querySelector('.w-8.h-8');
    expect(sizedEl).toBeTruthy();
  });

  it('applique la classe de taille xl', () => {
    const { container } = render(<LoadingSpinner size="xl" />);
    const sizedEl = container.querySelector('.w-16.h-16');
    expect(sizedEl).toBeTruthy();
  });

  it('applique la classe de taille xs', () => {
    const { container } = render(<LoadingSpinner size="xs" />);
    const sizedEl = container.querySelector('.w-3.h-3');
    expect(sizedEl).toBeTruthy();
  });

  it('affiche un message si fourni', () => {
    render(<LoadingSpinner message="Chargement en cours..." />);
    expect(screen.getByText('Chargement en cours...')).toBeTruthy();
  });

  it('n\'affiche pas de message si non fourni', () => {
    const { container } = render(<LoadingSpinner />);
    const paragraphs = container.querySelectorAll('p');
    // Should have no visible text messages
    const messagePs = Array.from(paragraphs).filter(p => p.textContent.trim().length > 0);
    expect(messagePs.length).toBe(0);
  });

  it('applique les couleurs primary par défaut', () => {
    const { container } = render(<LoadingSpinner />);
    // primary = "from-primary-500 to-accent-600"
    expect(container.innerHTML).toContain('from-primary-500');
  });

  it('applique les couleurs success', () => {
    const { container } = render(<LoadingSpinner color="success" />);
    expect(container.innerHTML).toContain('from-green-500');
  });

  it('applique les couleurs danger', () => {
    const { container } = render(<LoadingSpinner color="danger" />);
    expect(container.innerHTML).toContain('from-red-500');
  });

  it('affiche l\'icône par défaut (Loader2) quand showIcon=true', () => {
    render(<LoadingSpinner showIcon={true} />);
    expect(screen.getByTestId('icon-loader2')).toBeTruthy();
  });

  it('masque l\'icône quand showIcon=false', () => {
    render(<LoadingSpinner showIcon={false} />);
    expect(screen.queryByTestId('icon-loader2')).toBeNull();
  });

  it('utilise une icône custom si fournie', () => {
    const CustomIcon = (props) => <svg data-testid="custom-icon" {...props} />;
    render(<LoadingSpinner icon={CustomIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });

  it('applique className additionnel', () => {
    const { container } = render(<LoadingSpinner className="my-custom-class" />);
    expect(container.firstChild.className).toContain('my-custom-class');
  });

  it('affiche le badge sécurité quand le message contient "sécurisé"', () => {
    render(<LoadingSpinner message="Chargement sécurisé..." />);
    expect(screen.getByText('Connexion chiffrée')).toBeTruthy();
    expect(screen.getByTestId('icon-shield')).toBeTruthy();
  });

  it('n\'affiche pas le badge sécurité pour un message normal', () => {
    render(<LoadingSpinner message="Chargement en cours..." />);
    expect(screen.queryByText('Connexion chiffrée')).toBeNull();
  });

  it('affiche les particules pour les grandes tailles (lg, xl, 2xl)', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    // Particles are small divs with w-1 h-1
    const particles = container.querySelectorAll('.w-1.h-1');
    expect(particles.length).toBe(3);
  });

  it('n\'affiche pas les particules pour les petites tailles', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const particles = container.querySelectorAll('.w-1.h-1');
    expect(particles.length).toBe(0);
  });
});

describe('FullPageSpinner', () => {
  it('rend un overlay plein écran', () => {
    const { container } = render(<FullPageSpinner />);
    expect(container.querySelector('.fixed.inset-0')).toBeTruthy();
  });

  it('affiche le message par défaut "Chargement sécurisé..."', () => {
    render(<FullPageSpinner />);
    expect(screen.getByText('Chargement sécurisé...')).toBeTruthy();
  });

  it('utilise un message custom', () => {
    render(<FullPageSpinner message="Veuillez patienter..." />);
    expect(screen.getByText('Veuillez patienter...')).toBeTruthy();
  });
});

describe('ProgressSpinner', () => {
  it('affiche le pourcentage de progression', () => {
    render(<ProgressSpinner progress={75} />);
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('affiche 0% par défaut', () => {
    render(<ProgressSpinner />);
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('affiche un message optionnel', () => {
    render(<ProgressSpinner progress={50} message="Uploading..." />);
    expect(screen.getByText('Uploading...')).toBeTruthy();
  });

  it('n\'affiche pas de message si non fourni', () => {
    const { container } = render(<ProgressSpinner progress={50} />);
    // Should only have the % text, no additional p tags
    const ps = container.querySelectorAll('p');
    expect(ps.length).toBe(0);
  });
});
