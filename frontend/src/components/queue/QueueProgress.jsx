import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';

/**
 * Progress since this page was opened, from real peopleAhead values only.
 * The backend does not give "people ahead when you joined", so the baseline is the largest value seen in this view.
 */
export function QueueProgress({ peopleAhead }) {
  const [baseline, setBaseline] = useState(0);
  const bar = useRef(null);

  useEffect(() => {
    if (typeof peopleAhead === 'number') setBaseline((b) => Math.max(b, peopleAhead));
  }, [peopleAhead]);

  const total = Math.max(baseline, peopleAhead || 0);
  const moved = total - (peopleAhead || 0);
  const fraction = total > 0 ? moved / total : 0;

  useGSAP(
    () => {
      if (!bar.current) return;
      if (prefersReducedMotion()) gsap.set(bar.current, { scaleX: fraction });
      else gsap.to(bar.current, { scaleX: fraction, duration: duration.emphasis - 0.2, ease: ease.out, overwrite: true });
    },
    { dependencies: [fraction] },
  );

  if (total === 0) return null;

  return (
    <div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-border-subtle" role="progressbar" aria-label="Progress since you opened this page" aria-valuemin={0} aria-valuemax={total} aria-valuenow={moved}>
        <div ref={bar} className="h-full origin-left rounded-full bg-signal" style={{ transform: 'scaleX(0)' }} />
      </div>
      <p className="t-caption mt-2">
        {moved > 0 ? `Moved up ${moved} ${moved === 1 ? 'place' : 'places'} since you opened this page` : 'Your progress shows here as the line moves'}
      </p>
    </div>
  );
}
