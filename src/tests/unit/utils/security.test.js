import { describe, it, expect } from 'vitest';
import { escapeText, validateEmail, sanitizeHtml, sanitizeUrlInput, checkRateLimit, validateInput } from '../../../utils/security';

// ═══════════════════════════════════════════════
// escapeText
// ═══════════════════════════════════════════════
describe('escapeText', () => {
  it('échappe les balises <script>', () => {
    expect(escapeText('<script>alert("xss")</script>')).not.toContain('<script>');
    expect(escapeText('<script>alert("xss")</script>')).toContain('&lt;script&gt;');
  });

  it('échappe les balises <img> avec onerror', () => {
    const input = '<img src=x onerror=alert(1)>';
    const result = escapeText(input);
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  it('échappe les guillemets doubles', () => {
    expect(escapeText('test "value"')).toContain('&quot;');
  });

  it('échappe les guillemets simples', () => {
    expect(escapeText("test 'value'")).toContain('&#x27;');
  });

  it('échappe les ampersands', () => {
    expect(escapeText('a & b')).toContain('&amp;');
  });

  it('échappe les slashs', () => {
    expect(escapeText('a/b')).toContain('&#x2F;');
  });

  it('retourne une chaîne vide pour null', () => {
    expect(escapeText(null)).toBe('');
  });

  it('retourne une chaîne vide pour undefined', () => {
    expect(escapeText(undefined)).toBe('');
  });

  it('retourne une chaîne vide pour une chaîne vide', () => {
    expect(escapeText('')).toBe('');
  });

  it('ne modifie pas le texte sans caractères spéciaux', () => {
    expect(escapeText('Hello World')).toBe('Hello World');
  });
});

// ═══════════════════════════════════════════════
// validateEmail
// ═══════════════════════════════════════════════
describe('validateEmail', () => {
  it('valide un email correct', () => {
    expect(validateEmail('test@example.com')).toBe('test@example.com');
  });

  it('valide un email avec sous-domaine', () => {
    expect(validateEmail('user@mail.example.co')).toBe('user@mail.example.co');
  });

  it('valide un email avec tag +', () => {
    expect(validateEmail('user.name+tag@domain.co')).toBe('user.name+tag@domain.co');
  });

  it('normalise en minuscules et trim', () => {
    expect(validateEmail('  User@EXAMPLE.COM  ')).toBe('user@example.com');
  });

  it('rejette un email sans @', () => {
    expect(() => validateEmail('testexample.com')).toThrow("Format d'email invalide");
  });

  it('rejette un email sans domaine', () => {
    expect(() => validateEmail('test@')).toThrow("Format d'email invalide");
  });

  it('rejette un email avec espaces internes', () => {
    expect(() => validateEmail('test @example.com')).toThrow("Format d'email invalide");
  });

  it('rejette une chaîne vide', () => {
    expect(() => validateEmail('')).toThrow("Format d'email invalide");
  });
});

// ═══════════════════════════════════════════════
// sanitizeHtml
// ═══════════════════════════════════════════════
describe('sanitizeHtml', () => {
  it('supprime les balises <script>', () => {
    const result = sanitizeHtml('<script>alert(1)</script>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('</script>');
  });

  it('supprime les balises <style>', () => {
    const result = sanitizeHtml('<style>body{display:none}</style>');
    expect(result).not.toContain('<style');
  });

  it('supprime les balises <iframe>', () => {
    const result = sanitizeHtml('<iframe src="http://evil.com"></iframe>');
    expect(result).not.toContain('<iframe');
  });

  it('supprime les attributs onerror', () => {
    const result = sanitizeHtml('<img onerror="alert(1)" src="x">');
    expect(result).not.toContain('onerror');
  });

  it('supprime les attributs onclick', () => {
    const result = sanitizeHtml('<p onclick="alert(1)">text</p>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('<p>text</p>');
  });

  it('conserve les balises <b>', () => {
    expect(sanitizeHtml('<b>gras</b>')).toContain('<b>gras</b>');
  });

  it('conserve les balises <i>', () => {
    expect(sanitizeHtml('<i>italique</i>')).toContain('<i>italique</i>');
  });

  it('conserve les balises <em> et <strong>', () => {
    const result = sanitizeHtml('<em>em</em><strong>strong</strong>');
    expect(result).toContain('<em>em</em>');
    expect(result).toContain('<strong>strong</strong>');
  });

  it('conserve les balises <p> et <br>', () => {
    const result = sanitizeHtml('<p>para</p><br>');
    expect(result).toContain('<p>');
    expect(result).toContain('<br');
  });

  it('retourne une chaîne vide pour null', () => {
    expect(sanitizeHtml(null)).toBe('');
  });

  it('retourne une chaîne vide pour undefined', () => {
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('supprime les balises non autorisées comme <div>', () => {
    const result = sanitizeHtml('<div>contenu</div>');
    expect(result).not.toContain('<div');
    expect(result).toContain('contenu');
  });
});

// ═══════════════════════════════════════════════
// sanitizeUrlInput
// ═══════════════════════════════════════════════
describe('sanitizeUrlInput', () => {
  it('supprime les tentatives de path traversal (..)', () => {
    expect(sanitizeUrlInput('../../etc/passwd')).not.toContain('..');
  });

  it('supprime les slashs', () => {
    const result = sanitizeUrlInput('path/to/file');
    expect(result).not.toContain('/');
  });

  it('supprime les backslashs', () => {
    const result = sanitizeUrlInput('path\\to\\file');
    expect(result).not.toContain('\\');
  });

  it('conserve les caractères alphanumériques, tirets et underscores', () => {
    expect(sanitizeUrlInput('my-file_name123')).toBe('my-file_name123');
  });

  it('retourne une chaîne vide pour null', () => {
    expect(sanitizeUrlInput(null)).toBe('');
  });
});

// ═══════════════════════════════════════════════
// checkRateLimit (in security.js)
// ═══════════════════════════════════════════════
describe('checkRateLimit (security.js)', () => {
  it('autorise la première tentative', () => {
    expect(checkRateLimit('sec-test-action', 'user1', 3, 60000)).toBe(true);
  });

  it('autorise les tentatives dans la limite', () => {
    // Reset with a unique identifier
    const id = `sec-rl-${Date.now()}`;
    expect(checkRateLimit('sec-test', id, 3, 60000)).toBe(true);
    expect(checkRateLimit('sec-test', id, 3, 60000)).toBe(true);
    expect(checkRateLimit('sec-test', id, 3, 60000)).toBe(true);
  });

  it('bloque les tentatives au-delà de la limite', () => {
    const id = `sec-rl-block-${Date.now()}`;
    checkRateLimit('sec-block', id, 2, 60000);
    checkRateLimit('sec-block', id, 2, 60000);
    expect(checkRateLimit('sec-block', id, 2, 60000)).toBe(false);
  });
});

// ═══════════════════════════════════════════════
// validateInput
// ═══════════════════════════════════════════════
describe('validateInput', () => {
  it('valide un schéma correct', () => {
    const schema = {
      email: { required: true, type: 'email' },
      name: { required: true, type: 'text' },
    };
    const data = { email: 'test@example.com', name: 'John' };
    const result = validateInput(schema, data);
    expect(result.isValid).toBe(true);
    expect(result.sanitized.email).toBe('test@example.com');
  });

  it('détecte un champ requis manquant', () => {
    const schema = { email: { required: true, type: 'email' } };
    const result = validateInput(schema, { email: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('détecte un email invalide', () => {
    const schema = { email: { required: true, type: 'email' } };
    const result = validateInput(schema, { email: 'invalid' });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toContain('email invalide');
  });

  it('valide la longueur minimale', () => {
    const schema = { name: { required: true, type: 'text', minLength: 5 } };
    const result = validateInput(schema, { name: 'ab' });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toContain('Minimum 5');
  });

  it('valide la longueur maximale', () => {
    const schema = { name: { required: true, type: 'text', maxLength: 3 } };
    const result = validateInput(schema, { name: 'abcdef' });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toContain('Maximum 3');
  });

  it('sanitize le contenu HTML', () => {
    const schema = { content: { type: 'html' } };
    const result = validateInput(schema, { content: '<b>ok</b><script>evil</script>' });
    expect(result.isValid).toBe(true);
    expect(result.sanitized.content).toContain('<b>ok</b>');
    expect(result.sanitized.content).not.toContain('<script>');
  });
});
