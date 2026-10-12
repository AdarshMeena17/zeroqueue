import React from 'react';
import { Button } from './Button';

export const IconButton = React.forwardRef(function IconButton({ label, children, variant = 'ghost', ...props }, ref) {
  return (
    <Button ref={ref} size="icon" variant={variant} aria-label={label} title={label} {...props}>
      {children}
    </Button>
  );
});
