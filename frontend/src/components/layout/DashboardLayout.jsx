import { useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Building2, History, LayoutDashboard, ListOrdered, LogOut, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';
import { Logo } from '../shared/Logo';
import { ThemeToggle } from '../shared/ThemeToggle';
import { ConnectionIndicator } from '../queue/ConnectionIndicator';
import { PageReveal } from '../motion/PageReveal';
import { IconButton } from '../ui/IconButton';
import { cn } from '../../utils/cn';

// Only routes the role can actually open are listed.
const NAV = {
  user: [
    { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/app/queues', icon: ListOrdered, label: 'Queues' },
    { to: '/app/history', icon: History, label: 'History' },
  ],
  staff: [{ to: '/staff', icon: LayoutDashboard, label: 'Dashboard', end: true }],
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/queues', icon: ListOrdered, label: 'Queues' },
    { to: '/admin/staff', icon: Users, label: 'Staff' },
  ],
};

const ROLE_LABEL = { user: 'Member', staff: 'Staff', admin: 'Admin' };

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const links = NAV[user?.role] || NAV.user;

  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const placed = useRef(false);

  // Sliding active marker: measures the active link and glides to it.
  useGSAP(
    () => {
      const nav = navRef.current;
      const marker = indicatorRef.current;
      if (!nav || !marker) return;
      const active = nav.querySelector('a[aria-current="page"]');
      if (!active) {
        gsap.set(marker, { opacity: 0 });
        return;
      }
      const to = { y: active.offsetTop, height: active.offsetHeight, opacity: 1 };
      if (!placed.current || prefersReducedMotion()) {
        gsap.set(marker, to);
        placed.current = true;
      } else {
        gsap.to(marker, { ...to, duration: duration.normal - 0.15, ease: ease.out });
      }
    },
    { dependencies: [pathname, user?.role], scope: navRef },
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  };

  const linkClass = ({ isActive }) =>
    cn(
      'relative z-10 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium tracking-tight transition-colors duration-200',
      isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary',
    );

  return (
    <div className="min-h-dvh bg-bg-secondary text-text-primary lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-brand-accent focus:px-4 focus:py-2 focus:text-brand-accent-text"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[17.5rem] shrink-0 flex-col border-r border-border-subtle bg-bg-primary lg:flex">
        <div className="px-7 pb-6 pt-7">
          <Logo />
        </div>

        <div className="px-7">
          <span className="inline-flex items-center gap-2 rounded-sm border border-border-subtle px-2 py-1 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
            {ROLE_LABEL[user?.role] || 'Member'}
          </span>
        </div>

        <nav aria-label="Primary" className="mt-8 flex-1 px-4">
          <p className="t-label mb-3 px-3">Navigate</p>
          <div ref={navRef} className="relative flex flex-col gap-0.5">
            <span
              ref={indicatorRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 rounded-md bg-bg-tertiary opacity-0"
            >
              <span className="absolute inset-y-2 -left-4 w-[3px] rounded-r-full bg-signal" />
            </span>
            {links.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-border-subtle p-4">
          <div className="flex items-center gap-3 px-2 pb-3">
            <div
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-md bg-brand-accent font-display text-sm font-semibold uppercase text-brand-accent-text"
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="t-caption truncate">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-bg-secondary/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo textClassName="text-[1.05rem]" />
          <div className="flex items-center gap-1.5">
            <ConnectionIndicator />
            <ThemeToggle />
            <IconButton label="Sign out" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </IconButton>
          </div>
        </header>

        {/* Desktop utility bar */}
        <div className="sticky top-0 z-20 hidden items-center justify-between border-b border-border-subtle bg-bg-secondary/85 px-10 py-3 backdrop-blur lg:flex">
          <p className="t-label">QueueZero / {ROLE_LABEL[user?.role]}</p>
          <div className="flex items-center gap-2">
            <ConnectionIndicator />
            <ThemeToggle />
          </div>
        </div>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          <PageReveal>
            <Outlet />
          </PageReveal>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-bg-primary/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {links.map(({ to, icon: Icon, label, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-col items-center gap-1 px-2 py-3 text-[0.6875rem] font-medium tracking-wide transition-colors',
                    isActive ? 'text-text-primary' : 'text-text-tertiary',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn('absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-signal transition-opacity duration-200', isActive ? 'opacity-100' : 'opacity-0')}
                    />
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
