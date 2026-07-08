import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VetCare — Acceso',
  description: 'Plataforma de gestión veterinaria multi-tenant',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
      </div>

      {/* Grid pattern overlay */}
      <div className="auth-grid" />

      {/* Content */}
      <div className="auth-content">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
          <div>
            <span className="auth-logo-name">VetCare</span>
            <span className="auth-logo-tagline">SaaS Multi-Tenant</span>
          </div>
        </div>

        {children}

        <p className="auth-footer">
          © 2025 VetCare. Plataforma veterinaria de próxima generación.
        </p>
      </div>
    </div>
  );
}
