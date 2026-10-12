import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '../../../motion/gsap';
import { duration, ease } from '../../../motion/tokens';
import { Logo } from '../../../components/shared/Logo';
import { ThemeToggle } from '../../../components/shared/ThemeToggle';
import { buttonClasses } from '../../../components/ui/Button';
import { TokenStrip, demoStats } from '../../../components/queue/TokenStrip';

const USER_TOKEN = 47;

export default function Hero() {
  const root = useRef(null);
  const strip = useRef(null);
  const stage = useRef(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const el = (name) => root.current.querySelector(`[data-stat="${name}"]`);
      const demo = { n: 41 };

      // Isolated demo state -> DOM. Mirrors how the product derives position and wait.
      const draw = () => {
        strip.current?.render(demo.n);
        const s = demoStats(demo.n, USER_TOKEN);
        el('position').textContent = s.isTurn ? 'Now' : `#${s.position}`;
        el('ahead').textContent = String(s.peopleAhead);
        el('wait').textContent = s.isTurn ? 'Your turn' : `${s.wait} min`;
        el('wait').dataset.turn = s.isTurn ? 'true' : 'false';
      };

      if (prefersReducedMotion()) {
        demo.n = 44;
        draw();
        return;
      }

      // Living system: tokens advance at irregular intervals, the user's token reaches the front, the line resets.
      const holds = [1.3, 0.9, 1.7, 1.1, 1.5];
      const loop = gsap.timeline({ repeat: -1, paused: true });
      [42, 43, 44, 45, 46, 47].forEach((target, i) => {
        loop.to(demo, { n: target, duration: 1.05, ease: 'power3.inOut', onUpdate: draw }, i === 0 ? '+=0.6' : `+=${holds[i - 1]}`);
      });
      loop
        .to({}, { duration: 2.4 })
        .to(q('[data-hero=rail]'), { opacity: 0, duration: duration.fast, ease: ease.out })
        .call(() => {
          demo.n = 41;
          draw();
        })
        .to(q('[data-hero=rail]'), { opacity: 1, duration: duration.normal, ease: ease.out });

      // Master intro: foundation -> nav -> headline -> copy -> CTA -> system assembles -> motion -> settle.
      const tl = gsap.timeline({ defaults: { ease: ease.out } });
      tl.from(q('[data-hero=bg]'), { opacity: 0, duration: duration.emphasis, ease: ease.inOut })
        .from(q('[data-hero=nav] > *'), { y: -14, opacity: 0, duration: duration.normal, stagger: 0.07 }, '-=0.5')
        .from(q('[data-hero=line]'), { yPercent: 112, duration: duration.emphasis, ease: ease.expo, stagger: 0.12 }, '-=0.25')
        .from(q('[data-hero=copy]'), { y: 18, opacity: 0, duration: duration.normal, stagger: 0.08 }, '-=0.55')
        .from(q('[data-hero=cta] > *'), { y: 14, opacity: 0, duration: duration.normal, stagger: 0.08 }, '-=0.4')
        .from(q('[data-hero=stage]'), { opacity: 0, scale: 0.97, y: 24, duration: duration.emphasis, ease: ease.outStrong }, '-=0.3')
        .from(q('[data-hero=rail]'), { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power4.inOut' }, '<0.1')
        .from(q('[data-hero=stat]'), { y: 12, opacity: 0, duration: duration.normal, stagger: 0.07 }, '-=0.5')
        .add(() => loop.play(), '-=0.2');
    },
    { scope: root },
  );

  // Subtle pointer depth, marketing page only, fine pointers only.
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return undefined;
    const node = stage.current;
    const rx = gsap.quickTo(node, 'rotationX', { duration: 0.9, ease: ease.out });
    const ry = gsap.quickTo(node, 'rotationY', { duration: 0.9, ease: ease.out });
    const move = (e) => {
      ry((e.clientX / window.innerWidth - 0.5) * 4);
      rx(-(e.clientY / window.innerHeight - 0.5) * 2.5);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      gsap.killTweensOf(node, 'rotationX,rotationY');
    };
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden">
      <div
        data-hero="bg"
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_72%)]"
      />

      <header data-hero="nav" className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav aria-label="Sections" className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
          <a href="#how" className="transition-colors hover:text-text-primary">How it works</a>
          <a href="#live" className="transition-colors hover:text-text-primary">Live demo</a>
          <a href="#staff" className="transition-colors hover:text-text-primary">For staff</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'hidden sm:inline-flex' })}>
            Log in
          </Link>
          <Link to="/register" className={buttonClasses({ size: 'sm' })}>
            Get started
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 lg:pt-20">
        <p data-hero="copy" className="t-label flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
          Live queue management
        </p>

        <h1 className="t-hero mt-6 max-w-5xl">
          <span className="block overflow-hidden pb-[0.1em]"><span data-hero="line" className="block">Know your turn.</span></span>
          <span className="block overflow-hidden pb-[0.1em]"><span data-hero="line" className="block text-text-tertiary">Not your waiting time.</span></span>
        </h1>

        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p data-hero="copy" className="t-lead max-w-xl">
            QueueZero gives every person in line a token, an exact position and a live wait estimate — and gives staff one clear control to move the line forward.
          </p>
          <div data-hero="cta" className="flex flex-wrap gap-3">
            <Link to="/register" className={buttonClasses({ size: 'lg' })}>
              Join a queue <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#live" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
              Watch it move
            </a>
          </div>
        </div>

        <div className="mt-14 [perspective:1400px] sm:mt-20">
          <div
            ref={stage}
            data-hero="stage"
            className="grain relative overflow-hidden rounded-xl border border-border-subtle bg-bg-primary/70 p-3 shadow-card backdrop-blur-sm sm:p-6"
          >
            <div data-hero="rail">
              <TokenStrip ref={strip} userToken={USER_TOKEN} initial={41} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border-subtle bg-border-subtle sm:grid-cols-4">
              {[
                ['Your token', <span key="t" className="t-metric text-[clamp(1.5rem,3vw,2.25rem)]">A-047</span>],
                ['Position', <span key="p" data-stat="position" className="t-metric text-[clamp(1.5rem,3vw,2.25rem)]">#6</span>],
                ['People ahead', <span key="a" data-stat="ahead" className="t-metric text-[clamp(1.5rem,3vw,2.25rem)]">5</span>],
                ['Estimated wait', <span key="w" data-stat="wait" className="t-metric text-[clamp(1.5rem,3vw,2.25rem)] data-[turn=true]:text-signal-ink">25 min</span>],
              ].map(([label, value]) => (
                <div key={label} data-hero="stat" className="bg-bg-primary px-4 py-3.5 sm:px-5 sm:py-4">
                  <dt className="t-label">{label}</dt>
                  <dd className="mt-1.5">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="t-caption mt-3 text-right">Illustrative demo — not live queue data.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
