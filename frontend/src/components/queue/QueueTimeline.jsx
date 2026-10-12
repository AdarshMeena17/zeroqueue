import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cn } from '../../utils/cn';

const AHEAD_CAP = 8;
const BEHIND_CAP = 5;

// Show every person up to the cap; beyond it collapse the middle into a counted chip so the layout stays stable.
function segments(count, cap, head, tail) {
  if (count <= cap) return { dots: count, chip: 0, tail: 0 };
  return { dots: head, chip: count - head - tail, tail };
}

const Dot = ({ tone }) => (
  <span aria-hidden="true" className={cn('block h-2.5 w-2.5 shrink-0 rounded-full', tone === 'ahead' ? 'bg-text-primary/75' : 'border border-border-strong bg-transparent')} />
);

const Chip = ({ n, vertical }) => (
  <span aria-hidden="true" className={cn('shrink-0 rounded-sm border border-border-strong px-1.5 text-[0.65rem] font-medium tabular-nums text-text-secondary', vertical && 'text-center')}>
    +{n}
  </span>
);

function Run({ count, cap, head, tail, tone, vertical }) {
  const seg = segments(count, cap, head, tail);
  return (
    <>
      {Array.from({ length: seg.dots }, (_, i) => (
        <Dot key={`h${i}`} tone={tone} />
      ))}
      {seg.chip > 0 && <Chip n={seg.chip} vertical={vertical} />}
      {Array.from({ length: seg.tail }, (_, i) => (
        <Dot key={`t${i}`} tone={tone} />
      ))}
    </>
  );
}

/**
 * Honest queue progression built only from counts the backend supplies:
 *   [ now serving ] — people ahead — [ YOU ] — people behind
 * Individual people are anonymous dots; other users' tokens are never shown.
 * Horizontal on desktop, vertical on mobile. When the real counts change, the YOU group glides to its new place and the
 * serving point pulses. (No completed history is drawn: the user endpoints do not provide it.)
 */
export function QueueTimeline({ peopleAhead = 0, waitingCount, position, userStatus = 'waiting', servingActive, queueStatus, className }) {
  const desktop = useMediaQuery('(min-width: 768px)');
  const vertical = !desktop;
  const youGroup = useRef(null);
  const servingNode = useRef(null);
  const root = useRef(null);
  const last = useRef(null);

  const isServing = userStatus === 'serving';
  const behind = typeof waitingCount === 'number' ? Math.max(0, isServing ? waitingCount : waitingCount - (position || 0)) : null;

  useGSAP(
    () => {
      const group = youGroup.current;
      const container = root.current;
      if (!group || !container) return;
      const c = container.getBoundingClientRect();
      const g = group.getBoundingClientRect();
      const pos = vertical ? g.top - c.top : g.left - c.left;
      const snapshot = { pos, vertical, ahead: peopleAhead, serving: servingActive || isServing };
      const prev = last.current;
      last.current = snapshot;
      if (!prev || prefersReducedMotion() || prev.vertical !== vertical) return;

      const delta = prev.pos - pos;
      if (Math.abs(delta) > 1) {
        gsap.fromTo(group, { [vertical ? 'y' : 'x']: delta }, { [vertical ? 'y' : 'x']: 0, duration: duration.normal + 0.1, ease: ease.out, clearProps: 'transform', overwrite: 'auto' });
      }
      if (snapshot.ahead !== prev.ahead || snapshot.serving !== prev.serving) {
        gsap.fromTo(servingNode.current, { scale: 1.7 }, { scale: 1, duration: duration.normal, ease: ease.pop });
      }
    },
    { dependencies: [peopleAhead, behind, vertical, servingActive, isServing] },
  );

  const servingFilled = servingActive || isServing;

  return (
    <div className={className}>
      <div
        ref={root}
        role="img"
        aria-label={
          isServing
            ? 'You are being served now.'
            : `${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you${behind !== null ? `, ${behind} behind` : ''}.${servingActive ? '' : ' Nobody is being served right now.'}`
        }
        className={cn('relative flex items-center gap-2.5', vertical ? 'flex-col items-start py-1' : 'overflow-hidden py-3')}
      >
        {/* the rail */}
        <span aria-hidden="true" className={cn('absolute bg-border-strong', vertical ? 'bottom-3 left-[0.45rem] top-3 w-px' : 'inset-x-0 top-1/2 h-px')} />

        {/* serving point (this is you, once called) */}
        {!isServing && (
          <div className={cn('relative flex items-center gap-3', vertical ? 'flex-row' : 'flex-col')}>
            <span
              ref={servingNode}
              aria-hidden="true"
              className={cn('relative z-10 block h-[1.1rem] w-[1.1rem] rounded-full border-2', servingFilled ? 'border-signal bg-signal shadow-[0_0_24px_var(--qz-glow)]' : 'border-border-strong bg-bg-secondary')}
            />
            <span className="t-label whitespace-nowrap">{servingFilled ? 'Serving' : 'Idle'}</span>
          </div>
        )}

        {/* people ahead */}
        {!isServing && peopleAhead > 0 && (
          <div className={cn('relative z-10 flex items-center gap-2 bg-bg-secondary', vertical ? 'flex-col py-1' : 'px-1.5')}>
            <Run count={peopleAhead} cap={AHEAD_CAP} head={4} tail={2} tone="ahead" vertical={vertical} />
          </div>
        )}

        {/* you + people behind move together */}
        <div ref={youGroup} className={cn('relative z-10 flex items-center gap-2.5', vertical ? 'flex-col items-start' : 'bg-bg-secondary pl-1.5')}>
          <div className={cn('flex items-center gap-3', vertical ? 'flex-row' : 'flex-col')}>
            <span
              className={cn(
                'inline-flex items-center rounded-md bg-signal font-semibold uppercase tracking-[0.12em] text-ink',
                isServing ? 'h-9 px-4 text-sm shadow-[0_0_36px_var(--qz-glow)]' : 'h-7 px-3 text-[0.7rem]',
              )}
            >
              You
            </span>
          </div>
          {behind !== null && behind > 0 && (
            <div className={cn('flex items-center gap-2', vertical ? 'flex-col' : '')}>
              <Run count={behind} cap={BEHIND_CAP} head={4} tail={0} tone="behind" vertical={vertical} />
            </div>
          )}
        </div>
      </div>

      <p className="t-caption mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <span>{isServing ? 'You are at the front.' : `${peopleAhead} ahead`}</span>
        {behind !== null && <span>{behind} behind you</span>}
        {queueStatus && queueStatus !== 'active' && <span className="text-warn">Queue {queueStatus}</span>}
        <span className="text-text-tertiary/80">Each dot is a person waiting. Their details are never shown.</span>
      </p>
    </div>
  );
}
