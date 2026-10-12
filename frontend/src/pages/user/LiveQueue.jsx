import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, WifiOff } from 'lucide-react';
import { useLiveQueue } from '../../hooks/useLiveQueue';
import { usePageTitle } from '../../hooks/usePageTitle';
import { CONNECTION, useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errors';
import { formatToken, tokenFrom, formatTime } from '../../utils/format';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';
import { Button, buttonClasses } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ThemeToggle } from '../../components/shared/ThemeToggle';
import { Logo } from '../../components/shared/Logo';
import { TokenDisplay } from '../../components/motion/TokenDisplay';
import { AnimatedMetric } from '../../components/queue/AnimatedMetric';
import { ConnectionIndicator } from '../../components/queue/ConnectionIndicator';
import { QueueProgress } from '../../components/queue/QueueProgress';
import { QueueTimeline } from '../../components/queue/QueueTimeline';
import { StatusIndicator } from '../../components/queue/StatusIndicator';
import { TurnStage } from './live/TurnStage';
import { TerminalState } from './live/TerminalState';

function TopBar({ queue }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border-subtle bg-bg-secondary/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary" aria-label="Back to dashboard">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <Logo showText={false} className="sm:hidden" />
        <div className="flex items-center gap-2">
          {queue && <StatusIndicator status={queue.status} className="hidden sm:inline-flex" />}
          <ConnectionIndicator />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default function LiveQueue() {
  const { queueId } = useParams();
  const toast = useToast();
  const { state: socketState } = useSocket();
  const { phase, queue, status, entry, terminal, error, updatedAt, reload, leave } = useLiveQueue(queueId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const prefix = queue?.prefix;
  const myToken = entry ? formatToken(entry.displayToken) : null;
  const servingActive = Boolean(status?.servingEntryId);
  const serving = entry?.status === 'serving';
  // The backend keeps the last called token after a customer finishes; only call it "serving" while someone is.
  const currentToken = status?.currentDisplayToken ? formatToken(status.currentDisplayToken) : null;
  const queueStatus = status?.status || queue?.status;

  // ---- reactions to real state transitions ----
  const wasServing = useRef(false);
  useEffect(() => {
    if (serving && !wasServing.current && typeof navigator.vibrate === 'function') navigator.vibrate([140, 70, 140]);
    wasServing.current = serving;
  }, [serving]);

  usePageTitle(serving ? `Your turn · ${myToken}` : queue?.name ? `${queue.name} — live queue` : 'Live queue');

  const root = useRef(null);
  useGSAP(
    () => {
      if (phase !== 'ready' || !entry || prefersReducedMotion()) return;
      gsap.from(gsap.utils.selector(root)('[data-live=in]'), { y: 22, opacity: 0, duration: duration.normal, ease: ease.out, stagger: 0.07, clearProps: 'transform,opacity' });
    },
    { scope: root, dependencies: [phase, Boolean(entry)] },
  );

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leave();
      toast.info('You left the queue.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not leave the queue.'));
    } finally {
      setLeaving(false);
      setConfirmOpen(false);
    }
  };

  // ---- non-ready phases ----
  if (phase === 'loading') {
    return (
      <div className="min-h-dvh bg-bg-secondary">
        <TopBar />
        <div className="mx-auto max-w-6xl space-y-8 px-5 py-14 sm:px-8" aria-busy="true">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-40 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (phase === 'error' || phase === 'notfound') {
    return (
      <div className="min-h-dvh bg-bg-secondary text-text-primary">
        <TopBar />
        <div className="mx-auto max-w-2xl px-5 py-16">
          <EmptyState
            title={phase === 'notfound' ? 'This queue doesn’t exist' : 'We couldn’t load this queue'}
            description={phase === 'notfound' ? 'It may have been removed. Browse the available queues instead.' : error}
            action={
              phase === 'notfound' ? (
                <Link to="/app/queues" className={buttonClasses({ variant: 'outline' })}>Browse queues</Link>
              ) : (
                <Button variant="outline" onClick={reload}>
                  <RefreshCw className="h-4 w-4" /> Try again
                </Button>
              )
            }
          />
        </div>
      </div>
    );
  }

  const offline = socketState === CONNECTION.OFFLINE || socketState === CONNECTION.RECONNECTING;

  return (
    <div ref={root} className="relative min-h-dvh bg-bg-secondary text-text-primary">
      {/* The page behind the YOUR TURN overlay is inert; the overlay itself must stay reachable by assistive tech. */}
      <div inert={serving || undefined}>
      <TopBar queue={queue} />

      <main className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        {offline && (
          <div role="status" className="mt-5 flex items-center gap-2 rounded-md border border-warn/40 bg-warn/10 px-3.5 py-2.5 text-sm text-warn">
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            Live updates are paused — showing the last known state{updatedAt ? ` (${formatTime(updatedAt)})` : ''}. It will resync when the connection returns.
          </div>
        )}
        {queueStatus === 'paused' && (
          <p role="status" className="mt-5 rounded-md border border-border-strong px-3.5 py-2.5 text-sm text-text-secondary">This queue is paused. Calls resume when it is reopened.</p>
        )}
        {queueStatus === 'closed' && (
          <p role="status" className="mt-5 rounded-md border border-border-strong px-3.5 py-2.5 text-sm text-text-secondary">This queue is closed.</p>
        )}

        {!entry ? (
          <TerminalState status={terminal?.status || 'none'} token={terminal?.tokenNumber ? tokenFrom(prefix, terminal.tokenNumber) : null} queueName={queue?.name} />
        ) : (
          <>
            <div data-live="in" className="flex items-end justify-between gap-4 border-b border-border-subtle pb-4 pt-5 sm:pb-5 sm:pt-8">
              <div>
                <p className="t-label">{queue?.department?.name || 'Service'}</p>
                <h1 className="t-page mt-2">{queue?.name}</h1>
              </div>
              <StatusIndicator status={queueStatus} className="sm:hidden" />
            </div>

            <div className="grid gap-x-16 gap-y-6 py-6 sm:gap-y-10 sm:py-10 lg:grid-cols-[1.45fr_1fr] lg:py-14">
              {/* tokens */}
              <div className="flex flex-col gap-6 sm:gap-10">
                <section data-live="in" className="order-1 lg:order-2" aria-label="Your token">
                  <p className="t-label">Your token</p>
                  <div className="mt-3">
                    <TokenDisplay value={myToken} size="hero" />
                  </div>
                </section>
                <section data-live="in" className="order-2 border-t border-border-subtle pt-4 sm:pt-6 lg:order-1 lg:border-0 lg:pt-0" aria-label="Currently serving">
                  <p className="t-label">{servingActive ? 'Currently serving' : currentToken ? 'Last called' : 'Currently serving'}</p>
                  <div className="mt-3 flex items-end gap-4">
                    <TokenDisplay value={currentToken} size="lg" className={servingActive ? '' : 'opacity-60'} />
                    {!servingActive && <span className="t-caption pb-2">{currentToken ? 'No one is being served right now' : 'No one has been called yet'}</span>}
                  </div>
                </section>
              </div>

              {/* live numbers */}
              <dl data-live="in" className="grid grid-cols-3 gap-x-4 self-end border-t border-border-subtle pt-4 sm:pt-6 lg:grid-cols-1 lg:gap-y-8 lg:border-0 lg:pt-0">
                <AnimatedMetric label="Your position" value={entry.position} prefix="#" pad={2} className="lg:border-b lg:border-border-subtle lg:pb-6" />
                <AnimatedMetric label="People ahead" value={entry.peopleAhead} className="lg:border-b lg:border-border-subtle lg:pb-6" />
                <AnimatedMetric label="Estimated wait" value={entry.estimatedWaitTime} unit="min" />
              </dl>
            </div>

            <section data-live="in" aria-label="Queue progression" className="border-t border-border-subtle pt-8">
              <p className="t-label mb-5">Queue progression</p>
              <QueueTimeline
                peopleAhead={entry.peopleAhead}
                position={entry.position}
                waitingCount={status?.waitingCount}
                userStatus={entry.status}
                servingActive={servingActive}
                queueStatus={queueStatus}
              />
              <div className="mt-8 max-w-xl">
                <QueueProgress peopleAhead={entry.peopleAhead} />
              </div>
            </section>

            <footer data-live="in" className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle pt-6">
              <p className="t-caption">{updatedAt ? `Updated ${formatTime(updatedAt)}` : ''}</p>
              {entry.status === 'waiting' && (
                <Button variant="danger-ghost" onClick={() => setConfirmOpen(true)}>
                  Leave queue
                </Button>
              )}
            </footer>
          </>
        )}
      </main>
      </div>

      {serving && <TurnStage token={myToken} queueName={queue?.name} departmentName={queue?.department?.name} />}

      <ConfirmDialog
        open={confirmOpen}
        destructive
        loading={leaving}
        title="Leave this queue?"
        description="You will lose your place in line. Joining again gives you a new token at the back."
        confirmLabel="Leave queue"
        cancelLabel="Stay in line"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleLeave}
      />
    </div>
  );
}
