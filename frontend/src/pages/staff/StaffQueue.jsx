import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Megaphone, RefreshCw, SkipForward, WifiOff } from 'lucide-react';
import { useStaffQueue } from '../../hooks/useStaffQueue';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useFlipList } from '../../hooks/useFlipList';
import { CONNECTION, useSocket } from '../../context/SocketContext';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';
import { displayName, formatClock, formatTime, tokenFrom, ENTRY_STATUS } from '../../utils/format';
import { Button, buttonClasses } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ThemeToggle } from '../../components/shared/ThemeToggle';
import { TokenDisplay } from '../../components/motion/TokenDisplay';
import { NumberChange } from '../../components/motion/NumberChange';
import { ConnectionIndicator } from '../../components/queue/ConnectionIndicator';
import { StatusIndicator } from '../../components/queue/StatusIndicator';

const VISIBLE_ROWS = 8;

// Own component so the 1s tick re-renders only the timer, not the console.
function ServingTimer({ since }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const start = since ? new Date(since).getTime() : null;
  if (!start || Number.isNaN(start)) return null;
  return (
    <span className="tabular-nums" aria-label="Time since called">
      {formatClock((now - start) / 1000)}
    </span>
  );
}

function TopBar({ queue }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border-subtle bg-bg-secondary/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link to="/staff" className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Queues
        </Link>
        <div className="flex items-center gap-2">
          {queue && <StatusIndicator status={queue.status} className="hidden sm:inline-flex" />}
          <ConnectionIndicator />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default function StaffQueue() {
  const { queueId } = useParams();
  const { state: socketState } = useSocket();
  const { phase, error, queue, serving, waiting, finished, busy, updatedAt, perform, reload } = useStaffQueue(queueId);
  const [confirmSkip, setConfirmSkip] = useState(false);
  usePageTitle(queue?.name ? `${queue.name} — console` : 'Queue console');

  const prefix = queue?.prefix;
  const tok = (e) => (e ? tokenFrom(prefix, e.tokenNumber) : null);
  const next = waiting[0] || null;
  const active = queue?.status === 'active';

  // ---- list animation: rows glide, the called entry exits toward the serving panel ----
  const listRef = useRef(null);
  const ghostRef = useRef(null);
  const visible = waiting.slice(0, VISIBLE_ROWS);
  useFlipList(listRef, ghostRef, visible.map((e) => e._id).join(','), { x: -36, y: -28 });

  // ---- serving panel: accent ring settles when the serving entry really changes ----
  const panel = useRef(null);
  const ring = useRef(null);
  const lastServing = useRef(serving?._id);
  useGSAP(
    () => {
      const id = serving?._id;
      if (lastServing.current === id) return;
      lastServing.current = id;
      if (!id || prefersReducedMotion()) return;
      gsap.fromTo(ring.current, { opacity: 1 }, { opacity: 0, duration: duration.emphasis, ease: ease.out });
      gsap.fromTo(panel.current, { y: 10 }, { y: 0, duration: duration.normal, ease: ease.expo, clearProps: 'transform' });
    },
    { dependencies: [serving?._id] },
  );

  if (phase === 'loading') {
    return (
      <div className="min-h-dvh bg-bg-secondary">
        <TopBar />
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-10 sm:px-8" aria-busy="true">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (phase !== 'ready') {
    const copy = {
      forbidden: ['You’re not assigned to this queue', 'Only staff assigned to this queue’s department can operate it.'],
      notfound: ['This queue doesn’t exist', 'It may have been removed.'],
      error: ['We couldn’t load this queue', error],
    }[phase];
    return (
      <div className="min-h-dvh bg-bg-secondary text-text-primary">
        <TopBar />
        <div className="mx-auto max-w-2xl px-5 py-16">
          <EmptyState
            title={copy[0]}
            description={copy[1]}
            action={
              phase === 'error' ? (
                <Button variant="outline" onClick={reload}>
                  <RefreshCw className="h-4 w-4" /> Try again
                </Button>
              ) : (
                <Link to="/staff" className={buttonClasses({ variant: 'outline' })}>Back to my queues</Link>
              )
            }
          />
        </div>
      </div>
    );
  }

  const offline = socketState === CONNECTION.OFFLINE || socketState === CONNECTION.RECONNECTING;
  const nextBlocked = busy || !active || Boolean(serving) || !next;
  const hint = !active
    ? `This queue is ${queue.status}. Only an admin can reopen it.`
    : serving
      ? 'Complete or skip the current customer to call the next.'
      : !next
        ? 'No one is waiting.'
        : null;

  return (
    <div className="min-h-dvh bg-bg-secondary text-text-primary">
      <TopBar queue={queue} />

      <main className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-5 pt-8">
          <div>
            <p className="t-label">{queue.department?.name || 'Operations'}</p>
            <h1 className="t-page mt-2">{queue.name}</h1>
          </div>
          <p className="t-caption">{updatedAt ? `Synced ${formatTime(updatedAt)}` : ''}</p>
        </div>

        {offline && (
          <div role="status" className="mt-5 flex items-center gap-2 rounded-md border border-warn/40 bg-warn/10 px-3.5 py-2.5 text-sm text-warn">
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            Live updates are paused. Actions still go to the server and the list refreshes after each one.
          </div>
        )}

        <div className="grid gap-10 py-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          {/* ---- operate ---- */}
          <section aria-label="Operate queue" className="space-y-6">
            <div ref={panel} className="relative overflow-hidden rounded-xl border border-border-strong bg-bg-primary p-6 shadow-card sm:p-9">
              <div ref={ring} aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl border-2 border-signal opacity-0" />
              <div className="flex items-center justify-between">
                <p className="t-label">Currently serving</p>
                {serving && (
                  <p className="t-label flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-dot text-signal" aria-hidden="true" />
                    <ServingTimer since={serving.calledAt} />
                  </p>
                )}
              </div>
              <div className="mt-4">
                <TokenDisplay value={tok(serving)} size="hero" className={serving ? '' : 'opacity-70'} />
              </div>
              <p className="mt-4 min-h-[1.5rem] font-display text-xl font-medium tracking-[-0.02em]">
                {serving ? displayName(serving.user) || 'Customer' : <span className="text-text-tertiary">No one is being served</span>}
              </p>
            </div>

            <div className="grid grid-cols-6 gap-3">
              <Button
                size="lg"
                variant="signal"
                className="col-span-6 h-16 text-base sm:h-[4.5rem] sm:text-lg"
                disabled={nextBlocked}
                isLoading={busy === 'next'}
                onClick={() => perform('next')}
              >
                <Megaphone className="h-5 w-5" aria-hidden="true" />
                Call next{next ? ` · ${tok(next)}` : ''}
                {!busy && !nextBlocked && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
              </Button>
              <Button size="lg" variant="outline" className="col-span-6 h-14 sm:col-span-2" disabled={!serving || Boolean(busy)} isLoading={busy === 'complete'} onClick={() => perform('complete')}>
                <Check className="h-4 w-4" aria-hidden="true" /> Complete
              </Button>
              <Button size="lg" variant="outline" className="col-span-3 h-14 sm:col-span-2" disabled={!serving || Boolean(busy)} isLoading={busy === 'skip'} onClick={() => setConfirmSkip(true)}>
                <SkipForward className="h-4 w-4" aria-hidden="true" /> Skip
              </Button>
              <Button size="lg" variant="outline" className="col-span-3 h-14 sm:col-span-2" disabled={!serving || Boolean(busy)} isLoading={busy === 'recall'} onClick={() => perform('recall')}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Recall
              </Button>
            </div>
            <p className="t-caption min-h-[1.25rem]" aria-live="polite">{hint}</p>
          </section>

          {/* ---- waiting list ---- */}
          <section aria-label="Waiting list">
            <div className="flex items-end justify-between border-b border-border-subtle pb-4">
              <div>
                <p className="t-label">Waiting</p>
                <p className="t-metric mt-1.5">
                  <NumberChange value={waiting.length} />
                </p>
              </div>
              {queue.averageServiceTime ? <p className="t-caption">~{queue.averageServiceTime} min per customer</p> : null}
            </div>

            {waiting.length === 0 ? (
              <EmptyState compact className="mt-6" title="Nobody is waiting" description="New arrivals appear here the moment they join." />
            ) : (
              <div className="relative">
                <ul ref={listRef} className="divide-y divide-border-subtle">
                  {visible.map((e, i) => (
                    <li
                      key={e._id}
                      data-flip-key={e._id}
                      className={`flex items-center justify-between gap-4 py-4 ${i === 0 ? 'relative' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="t-label w-7 tabular-nums">#{String(e.position ?? i + 1).padStart(2, '0')}</span>
                        <div>
                          <p className={`font-display font-semibold tabular-nums tracking-tight ${i === 0 ? 'text-2xl' : 'text-lg'}`}>{tok(e)}</p>
                          <p className="t-caption">{i < 2 ? displayName(e.user) || 'Customer' : 'Waiting'}</p>
                        </div>
                      </div>
                      {i === 0 ? <Badge variant="serving">Next up</Badge> : <span className="t-caption tabular-nums">~{e.estimatedWaitTime} min</span>}
                    </li>
                  ))}
                </ul>
                <div ref={ghostRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
                {waiting.length > VISIBLE_ROWS && <p className="t-caption border-t border-border-subtle pt-4">+ {waiting.length - VISIBLE_ROWS} more waiting</p>}
              </div>
            )}

            {finished.length > 0 && (
              <div className="mt-10">
                <p className="t-label mb-3">Recently finished</p>
                <ul className="space-y-2">
                  {finished.slice(0, 4).map((e) => {
                    const meta = ENTRY_STATUS[e.status] || { label: e.status, variant: 'default' };
                    return (
                      <li key={e._id} className="flex items-center justify-between text-sm text-text-secondary">
                        <span className="font-display font-medium tabular-nums">{tok(e)}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>

      <ConfirmDialog
        open={confirmSkip}
        destructive
        loading={busy === 'skip'}
        title={`Skip ${tok(serving) || 'this customer'}?`}
        description="They will be told their token was skipped and will have to join again for a new token."
        confirmLabel="Skip customer"
        onCancel={() => setConfirmSkip(false)}
        onConfirm={async () => {
          await perform('skip');
          setConfirmSkip(false);
        }}
      />
    </div>
  );
}
