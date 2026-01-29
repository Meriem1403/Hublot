import { useState } from "react";
import { setAuthenticated } from "../utils/security";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    position: "relative" as const,
    overflow: "hidden",
    background: "linear-gradient(135deg, #082f49 0%, #1e3a5f 50%, #164e63 100%)",
  },
  bgLayer: {
    position: "absolute" as const,
    inset: 0,
    zIndex: 0,
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  overlay: {
    position: "absolute" as const,
    inset: 0,
    background: "linear-gradient(135deg, rgba(8, 47, 73, 0.9) 0%, rgba(6, 78, 99, 0.85) 50%, rgba(8, 51, 68, 0.9) 100%)",
  },
  leftPanel: {
    display: "none",
    width: "50%",
    position: "relative" as const,
    zIndex: 10,
    flexDirection: "column" as const,
    justifyContent: "center" as const,
    paddingLeft: "4rem",
    paddingRight: "4rem",
    color: "white",
  },
  rightPanel: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    position: "relative" as const,
    zIndex: 10,
  },
  card: {
    width: "100%",
    maxWidth: "28rem",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    borderRadius: "1rem",
    padding: "2rem",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  title: {
    margin: 0,
    marginBottom: "0.5rem",
    fontSize: "1.875rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  subtitle: {
    margin: 0,
    marginBottom: "1.5rem",
    color: "#4b5563",
    fontSize: "0.875rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    boxSizing: "border-box" as const,
  },
  button: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "white",
    background: "linear-gradient(90deg, #0891b2, #2563eb)",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
  },
  badge: {
    marginTop: "1.5rem",
    textAlign: "center" as const,
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.8)",
  },
};

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const expectedUsername = String(import.meta.env.VITE_APP_USERNAME || "admin").trim();
    const expectedPassword = String(import.meta.env.VITE_APP_PASSWORD || "demo").trim();
    const inputUser = email.trim();
    const inputPass = password.trim();

    setTimeout(() => {
      if (inputUser === expectedUsername && inputPass === expectedPassword) {
        setAuthenticated(true);
        sessionStorage.setItem("username", inputUser);
        sessionStorage.setItem("loginTime", new Date().toISOString());
        if (inputUser === "admin") {
          sessionStorage.setItem("userDisplayName", "Alice Durand");
          sessionStorage.setItem("userService", "Secrétariat Général");
          sessionStorage.setItem("userRole", "Administratrice DIRM");
        }
        onLoginSuccess();
      } else {
        setError("Identifiant ou mot de passe incorrect.");
        setLoading(false);
      }
    }, 400);
  };

  const iconInput = { ...styles.input, paddingLeft: "2.75rem" };
  const inputWrap = { position: "relative" as const };

  return (
    <div style={styles.page}>
      <style>{`
        @media (min-width: 1024px) {
          .login-left-panel { display: flex !important; }
          .login-right-panel { width: 50% !important; }
        }
        @keyframes loginFadeInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes loginFadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes loginRotate {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(8deg); }
          75% { transform: rotate(-8deg); }
        }
        @keyframes loginParticle {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-24px); opacity: 0.6; }
        }
        .login-anim-left { animation: loginFadeInLeft 0.8s ease-out forwards; }
        .login-anim-up { animation: loginFadeInUp 0.6s ease-out forwards; }
        .login-anim-up-1 { animation: loginFadeInUp 0.6s ease-out 0.2s both; }
        .login-anim-up-2 { animation: loginFadeInUp 0.6s ease-out 0.4s both; }
        .login-anim-float { animation: loginFloat 4s ease-in-out infinite; }
        .login-anim-rotate { animation: loginRotate 3s ease-in-out infinite; }
        .login-anim-card { animation: loginFadeInUp 0.8s ease-out 0.2s both; }
        .login-anim-badge { animation: loginFadeInUp 0.6s ease-out 1s both; }
        .login-icon-abs {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
      {/* Image de fond + overlay */}
      <div style={styles.bgLayer}>
        <img
          src="https://images.unsplash.com/photo-1678195137626-d1dc98048caf?w=1080&q=80"
          alt="Ocean"
          style={styles.img}
        />
        <div style={styles.overlay} />
      </div>

      {/* Vagues animées en bas */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "8rem", zIndex: 1, opacity: 0.2, animation: "loginFloat 4s ease-in-out infinite" }}>
        <svg viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", color: "#67e8f9" }}>
          <path d="M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 V120 H0 Z" fill="currentColor" opacity="0.6"/>
          <path d="M0 80 Q150 40 300 80 T600 80 T900 80 T1200 80 V120 H0 Z" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>

      {/* Panneau gauche - visible sur grand écran */}
      <div className="login-left-panel login-anim-left" style={styles.leftPanel}>
        <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="login-anim-rotate" style={{ color: "#67e8f9", width: 64, height: 64 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/></svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "3rem", fontWeight: 700, background: "linear-gradient(90deg, #a5f3fc, #7dd3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Ministère de la Mer
            </h1>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.25rem", color: "#a5f3fc" }}>Statistiques RH</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "3rem" }}>
          <div className="login-anim-up-1" style={{ display: "flex", gap: "1rem", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", borderRadius: "0.75rem", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ background: "rgba(34, 211, 238, 0.2)", padding: "0.75rem", borderRadius: "0.5rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontWeight: 600, fontSize: "1.125rem" }}>Tableaux de bord avancés</h3>
              <p style={{ margin: 0, color: "#cffafe", opacity: 0.9, fontSize: "0.875rem" }}>Visualisez et analysez les données RH en temps réel avec des graphiques interactifs et des rapports personnalisés.</p>
            </div>
          </div>
          <div className="login-anim-up-2" style={{ display: "flex", gap: "1rem", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", borderRadius: "0.75rem", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ background: "rgba(34, 211, 238, 0.2)", padding: "0.75rem", borderRadius: "0.5rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontWeight: 600, fontSize: "1.125rem" }}>Gestion du personnel</h3>
              <p style={{ margin: 0, color: "#cffafe", opacity: 0.9, fontSize: "0.875rem" }}>Suivez les effectifs, les compétences et les formations du personnel maritime en un seul endroit.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="login-right-panel" style={styles.rightPanel}>
        <div className="login-anim-card" style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/></svg>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>Ministère de la Mer</h2>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#4b5563" }}>Statistiques RH</p>
            </div>
          </div>
          <h2 style={styles.title}>Bienvenue</h2>
          <p style={styles.subtitle}>Connectez-vous pour accéder à votre espace</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label htmlFor="email" style={styles.label}>Adresse email</label>
              <div style={inputWrap}>
                <span className="login-icon-abs" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  id="email"
                  type="text"
                  placeholder="nom.prenom@mer.gouv.fr"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={iconInput}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" style={styles.label}>Mot de passe</label>
              <div style={inputWrap}>
                <span className="login-icon-abs" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={iconInput}
                />
              </div>
            </div>
            {error && (
              <p style={{ margin: 0, padding: "0.75rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "0.5rem", fontSize: "0.875rem" }}>
                {error}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "#4b5563" }}>
                <input type="checkbox" style={{ width: 16, height: 16 }}/>
                <span>Se souvenir de moi</span>
              </label>
              <button type="button" style={{ background: "none", border: "none", fontSize: "0.875rem", color: "#0891b2", cursor: "pointer", fontWeight: 500 }}>Mot de passe oublié ?</button>
            </div>
            <button type="submit" disabled={loading} style={{ ...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p style={{ margin: "1.5rem 0 0 0", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb", fontSize: "0.875rem", color: "#4b5563", textAlign: "center" }}>
            Besoin d'aide ? <button type="button" style={{ background: "none", border: "none", color: "#0891b2", cursor: "pointer", fontWeight: 500 }}>Contacter le support technique</button>
          </p>
        </div>
        <p className="login-anim-badge" style={{ ...styles.badge, position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "28rem" }}>🔒 Connexion sécurisée SSL</p>
      </div>

      {/* Particules flottantes */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="login-particle"
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "rgba(103, 232, 249, 0.3)",
            left: `${15 + i * 16}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `loginParticle ${3 + i}s ease-in-out ${i * 0.5}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
