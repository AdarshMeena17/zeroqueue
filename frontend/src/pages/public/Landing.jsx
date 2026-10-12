import { useEffect } from 'react';
import { ScrollTrigger } from '../../motion/gsap';
import Hero from './landing/Hero';
import Problem from './landing/Problem';
import HowItWorks from './landing/HowItWorks';
import LiveVisualization from './landing/LiveVisualization';
import { ForUsers, ForStaff } from './landing/Audience';
import Realtime from './landing/Realtime';
import Difference from './landing/Difference';
import FinalCTA from './landing/FinalCTA';
import Footer from './landing/Footer';

export default function Landing() {
  // Fonts change text metrics; recompute scroll positions once they are ready.
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => live && ScrollTrigger.refresh());
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-bg-secondary text-text-primary">
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <LiveVisualization />
        <ForUsers />
        <ForStaff />
        <Realtime />
        <Difference />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
