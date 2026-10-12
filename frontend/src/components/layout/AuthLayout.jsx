import { Link, Outlet } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { ThemeToggle } from '../shared/ThemeToggle';
import { PageReveal } from '../motion/PageReveal';
import { AuthVisual } from './AuthVisual';

export function AuthLayout() {
  return (
    <div className="min-h-dvh bg-bg-secondary text-text-primary lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden lg:block" aria-hidden="true">
        <div className="sticky top-0 h-dvh">
          <AuthVisual />
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link to="/" aria-label="QueueZero home" className="lg:invisible">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-[26rem]">
            <PageReveal>
              <Outlet />
            </PageReveal>
          </div>
        </main>
      </div>
    </div>
  );
}
