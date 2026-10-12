import { Logo } from './Logo';

export function BootScreen({ label = 'Restoring your session' }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg-secondary text-text-primary" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-6">
        <Logo />
        <div className="h-px w-40 overflow-hidden bg-border-strong" aria-hidden="true">
          <div className="h-full w-1/3 animate-slide bg-signal" />
        </div>
        <p className="t-label">{label}</p>
      </div>
    </div>
  );
}
