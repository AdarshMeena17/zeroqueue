import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, DoorOpen, SkipForward, Ticket } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '../../../motion/gsap';
import { duration, ease } from '../../../motion/tokens';
import { buttonClasses } from '../../../components/ui/Button';
import { TokenDisplay } from '../../../components/motion/TokenDisplay';

const COPY = {
  completed: { icon: CircleCheck, eyebrow: 'Completed', title: 'You’ve been served.', text: 'Your token is complete. Thanks for waiting with QueueZero.' },
  skipped: { icon: SkipForward, eyebrow: 'Skipped', title: 'Your token was skipped.', text: 'Staff moved on from this token. You can join the queue again for a new one.' },
  cancelled: { icon: DoorOpen, eyebrow: 'Left queue', title: 'You left this queue.', text: 'Your place was released. Join again any time for a new token.' },
  none: { icon: Ticket, eyebrow: 'No active place', title: 'You’re not in this queue.', text: 'There’s no active token for you here. Browse the queues to take one.' },
};

/** Shown when there is no active entry. Position and wait values are never displayed here. */
export function TerminalState({ status = 'none', token, queueName }) {
  const root = useRef(null);
  const { icon: Icon, eyebrow, title, text } = COPY[status] || COPY.none;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(gsap.utils.selector(root)('[data-t]'), { y: 18, opacity: 0, duration: duration.normal, ease: ease.out, stagger: 0.08 });
    },
    { scope: root, dependencies: [status] },
  );

  return (
    <section ref={root} aria-live="polite" className="mx-auto flex max-w-xl flex-col items-start py-16 sm:py-24">
      <span data-t className="grid h-12 w-12 place-items-center rounded-md border border-border-strong">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p data-t className="t-label mt-8">{eyebrow}{queueName ? ` · ${queueName}` : ''}</p>
      <h1 data-t className="t-page mt-3">{title}</h1>
      {token && (
        <div data-t className="mt-6 text-text-tertiary">
          <TokenDisplay value={token} size="lg" />
        </div>
      )}
      <p data-t className="t-lead mt-5">{text}</p>
      <div data-t className="mt-10 flex flex-wrap gap-3">
        <Link to="/app/queues" className={buttonClasses({ size: 'lg' })}>
          Browse queues <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/app/history" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
          View history
        </Link>
      </div>
    </section>
  );
}
