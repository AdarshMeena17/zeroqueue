import { useEffect } from 'react';

// Route-level document title, so screen-reader and tab users can tell pages apart.
export function usePageTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = `${title} · QueueZero`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
