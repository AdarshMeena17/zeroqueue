import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '../../../motion/gsap';
import { buttonClasses } from '../../../components/ui/Button';

export default function FinalCTA() {
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        '[data-panel]',
        { clipPath: 'circle(0% at 50% 100%)' },
        {
          clipPath: 'circle(150% at 50% 100%)',
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top 20%', scrub: 0.5 },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="bg-obsidian">
      <div data-panel data-surface="signal" className="bg-signal text-ink">
        <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8 sm:py-40">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink/60">Ready when you are</p>
          <h2 className="t-hero mt-6 max-w-4xl">You’re not waiting blindly anymore.</h2>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link to="/register" className={buttonClasses({ size: 'lg', className: '!bg-ink !text-bone hover:!bg-ink/90' })}>
              Create an account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className={buttonClasses({ variant: 'ghost', size: 'lg', className: '!text-ink hover:!bg-ink/10' })}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
