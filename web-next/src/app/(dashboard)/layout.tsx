'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PawPrint,
  Building2,
  LogOut,
  Menu,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/hooks/use-auth';
import { translateRole } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

const navItemsVet = [
  { href: '/vet', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/vet/pets', label: 'Pacientes', icon: PawPrint },
  { href: '/vet/history', label: 'Historial', icon: Clock },
  { href: '/clinics', label: 'Clínica', icon: Building2 },
];

const navItemsAdmin = [
  { href: '/clinic-admin', label: 'Dashboard Admin', icon: LayoutDashboard, exact: true },
  { href: '/clinics', label: 'Mis Clínicas', icon: Building2 },
  { href: '/vet/pets', label: 'Pacientes', icon: PawPrint },
  { href: '/vet/history', label: 'Historial', icon: Clock },
];

const navItemsOwner = [
  { href: '/owner', label: 'Mis Mascotas', icon: PawPrint, exact: true },
  { href: '/clinics', label: 'Mi Clínica', icon: Building2 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const navItems =
    user?.role === 'OWNER'
      ? navItemsOwner
      : user?.role === 'CLINIC_ADMIN' || user?.role === 'SUPER_ADMIN'
      ? navItemsAdmin
      : navItemsVet;

  // Redirect if not authenticated after loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      useAuthStore.getState().logout();
      router.push('/login');
    }
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)', padding: '6px', borderRadius: '8px' }}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="sidebar-logo-text">VetCare</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <IconComponent className={`w-4 h-4 ${active ? 'text-teal-600 font-semibold' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-role">{translateRole(user.role)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="sidebar-logout-btn"
            id="logout-btn"
            title="Cerrar sesión"
          >
            {loggingOut ? <Spinner size="sm" /> : <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-400 transition-colors" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="dashboard-main">
        {/* Mobile header */}
        <header className="dashboard-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            id="sidebar-toggle"
          >
            <Menu className="w-5 h-5 text-slate-200" />
          </button>
          <span className="dashboard-header-logo">VetCare</span>
          <div className="dashboard-header-avatar">
            {user.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
        </header>

        {/* Page content */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
