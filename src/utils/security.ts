/**
 * Utilitaires de sécurité pour l'application StatDirm
 * Protection des données sensibles
 */

/**
 * Masque partiellement un nom/prénom pour l'affichage
 * Exemple: "Dupont" -> "D***t", "Jean" -> "J***"
 */
export function maskName(name: string): string {
  if (!name || name.length <= 2) return name;
  if (name.length <= 4) {
    return name[0] + '*'.repeat(name.length - 1);
  }
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

/**
 * Masque partiellement un identifiant
 */
export function maskId(id: string | number): string {
  const idStr = String(id);
  if (idStr.length <= 4) return '***';
  return idStr.substring(0, 2) + '*'.repeat(idStr.length - 4) + idStr.substring(idStr.length - 2);
}

/**
 * Masque partiellement une date de naissance (affiche seulement l'année)
 */
export function maskDateOfBirth(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.getFullYear().toString();
  } catch {
    return '****';
  }
}

/**
 * Vérifie si l'utilisateur est authentifié (basé sur sessionStorage)
 */
export function isAuthenticated(): boolean {
  const authenticated = sessionStorage.getItem('authenticated') === 'true';
  const loginTime = sessionStorage.getItem('loginTime');
  
  if (!authenticated || !loginTime) {
    return false;
  }

  // Vérifier que la session n'a pas expiré (8 heures par défaut)
  const loginDate = new Date(loginTime);
  const now = new Date();
  const sessionDuration = 8 * 60 * 60 * 1000; // 8 heures en millisecondes
  
  if (now.getTime() - loginDate.getTime() > sessionDuration) {
    // Session expirée
    clearSession();
    return false;
  }

  return true;
}

/**
 * Définit l'état d'authentification
 */
export function setAuthenticated(value: boolean): void {
  if (value) {
    sessionStorage.setItem('authenticated', 'true');
    sessionStorage.setItem('loginTime', new Date().toISOString());
  } else {
    clearSession();
  }
}

/**
 * Récupère le nom d'utilisateur de la session
 */
export function getUsername(): string | null {
  return sessionStorage.getItem('username');
}

/**
 * Nom affiché de l'utilisateur (ex. "Alice Durand")
 * Stocké dans sessionStorage.userDisplayName, sinon fallback sur username
 */
export function getDisplayName(): string {
  const display = sessionStorage.getItem('userDisplayName');
  const username = sessionStorage.getItem('username');
  return display || username || '';
}

/**
 * Service de l'utilisateur (ex. "Secrétariat Général")
 */
export function getService(): string {
  return sessionStorage.getItem('userService') || 'Secrétariat Général';
}

/**
 * Rôle de l'utilisateur (ex. "Administratrice DIRM")
 */
export function getRole(): string {
  return sessionStorage.getItem('userRole') || 'Administratrice DIRM';
}

/**
 * Récupère le temps de connexion
 */
export function getLoginTime(): Date | null {
  const loginTime = sessionStorage.getItem('loginTime');
  return loginTime ? new Date(loginTime) : null;
}

/**
 * Vide la session (déconnexion)
 */
export function clearSession(): void {
  sessionStorage.removeItem('authenticated');
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('loginTime');
  sessionStorage.removeItem('userDisplayName');
  sessionStorage.removeItem('userService');
  sessionStorage.removeItem('userRole');
}

/**
 * Valide et nettoie une entrée utilisateur pour prévenir les injections
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Supprimer les balises HTML
    .replace(/javascript:/gi, '') // Supprimer les protocoles javascript
    .replace(/on\w+=/gi, '') // Supprimer les handlers d'événements
    .trim();
}

/**
 * Valide un filtre de région/service/statut
 */
export function validateFilter(value: string, allowedValues: string[]): boolean {
  if (!value || value === 'all') return true;
  return allowedValues.includes(value);
}
