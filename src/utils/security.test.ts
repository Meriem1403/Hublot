/**
 * Tests unitaires de sécurité — couvre src/utils/security.ts
 *
 * Objectif (stratégie « shift-left ») : vérifier automatiquement, à chaque
 * intégration, les briques de sécurité côté client :
 *   - assainissement des entrées (anti-injection / XSS basique)
 *   - validation des filtres (anti-valeur arbitraire)
 *   - masquage des données RH sensibles
 *   - cycle de vie de la session (authentification + expiration)
 *
 * Rattachement : ST-SEC02 (voir docs/SCENARIOS_TEST.md).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeInput,
  validateFilter,
  maskName,
  maskId,
  maskDateOfBirth,
  isAuthenticated,
  setAuthenticated,
  clearSession,
  getUsername
} from './security';

describe('sanitizeInput — anti-injection / XSS', () => {
  it('supprime les chevrons (balises HTML)', () => {
    const out = sanitizeInput('<script>alert(1)</script>');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
  });

  it('supprime le protocole javascript:', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
  });

  it("supprime les handlers d'événements en ligne (onerror=, onclick=)", () => {
    const out = sanitizeInput('<img src=x onerror=alert(1)>');
    expect(out.toLowerCase()).not.toContain('onerror=');
    expect(out).not.toContain('<');
  });

  it('coupe les espaces superflus', () => {
    expect(sanitizeInput('   hublot   ')).toBe('hublot');
  });

  it("renvoie une chaîne vide pour une entrée vide/nulle", () => {
    expect(sanitizeInput('')).toBe('');
    // @ts-expect-error : robustesse face à une entrée non typée
    expect(sanitizeInput(undefined)).toBe('');
  });
});

describe('validateFilter — anti-valeur arbitraire', () => {
  const allowed = ['DIRM MED', 'DIRM NANTES', 'DGAMPA'];

  it('accepte la valeur par défaut « all » et la chaîne vide', () => {
    expect(validateFilter('all', allowed)).toBe(true);
    expect(validateFilter('', allowed)).toBe(true);
  });

  it('accepte une valeur présente dans la liste autorisée', () => {
    expect(validateFilter('DIRM MED', allowed)).toBe(true);
  });

  it('refuse une valeur hors liste (tentative d’injection de filtre)', () => {
    expect(validateFilter("DIRM MED'; DROP TABLE", allowed)).toBe(false);
    expect(validateFilter('inconnu', allowed)).toBe(false);
  });
});

describe('masquage des données RH sensibles', () => {
  it('maskName masque le cœur du nom mais préserve les bornes', () => {
    expect(maskName('Jo')).toBe('Jo'); // trop court : inchangé
    expect(maskName('Jean')).toBe('J***');
    expect(maskName('Dupont')).toBe('D****t');
  });

  it('maskId masque la partie centrale de l’identifiant', () => {
    expect(maskId('1234')).toBe('***');
    expect(maskId('123456')).toBe('12**56');
  });

  it('maskDateOfBirth ne révèle que l’année', () => {
    expect(maskDateOfBirth('1985-06-15')).toBe('1985');
    expect(maskDateOfBirth('')).toBe('');
  });
});

describe('cycle de vie de la session', () => {
  beforeEach(() => {
    clearSession();
    sessionStorage.clear();
  });

  it("isAuthenticated est faux sans session", () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('setAuthenticated(true) ouvre une session valide', () => {
    setAuthenticated(true);
    expect(isAuthenticated()).toBe(true);
  });

  it('clearSession ferme la session et purge le username', () => {
    setAuthenticated(true);
    sessionStorage.setItem('username', 'admin');
    clearSession();
    expect(isAuthenticated()).toBe(false);
    expect(getUsername()).toBeNull();
  });

  it('une session de plus de 8 h est considérée expirée', () => {
    const neufHeures = new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString();
    sessionStorage.setItem('authenticated', 'true');
    sessionStorage.setItem('loginTime', neufHeures);
    expect(isAuthenticated()).toBe(false);
  });
});
