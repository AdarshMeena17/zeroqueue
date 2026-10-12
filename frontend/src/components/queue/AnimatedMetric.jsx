import { NumberChange } from '../motion/NumberChange';
import { cn } from '../../utils/cn';

// A labelled live number. Real value in, tweened on change. `value` undefined/null renders a quiet dash.
export function AnimatedMetric({ label, value, prefix, suffix, pad, unit, size = 'metric', className, valueClassName }) {
  return (
    <div className={className}>
      <p className="t-label">{label}</p>
      <p className={cn(size === 'metric' ? 't-metric' : 't-token', 'mt-2', valueClassName)}>
        <NumberChange value={typeof value === 'number' ? value : null} prefix={prefix} suffix={suffix} pad={pad} />
        {unit && typeof value === 'number' && <span className="ml-1.5 text-[0.4em] font-normal tracking-normal text-text-tertiary">{unit}</span>}
      </p>
    </div>
  );
}
