import { Link } from 'react-router-dom';
import { Logo } from '../../../components/shared/Logo';

export default function Footer() {
  return (
    <footer data-surface="dark" className="bg-obsidian text-bone">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo />
        <nav aria-label="Footer" className="flex gap-6 text-sm text-bone/75">
          <Link to="/login" className="transition-colors hover:text-bone">Log in</Link>
          <Link to="/register" className="transition-colors hover:text-bone">Create account</Link>
        </nav>
        <p className="text-xs text-bone/65">© 2026 QueueZero</p>
      </div>
    </footer>
  );
}
