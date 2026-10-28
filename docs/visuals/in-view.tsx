import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface InViewProps {
  fallbackInView?: boolean;
  children: (state: {
    ref: (element: HTMLElement | null) => void;
    inView: boolean;
  }) => ReactNode;
}

/**
 * Pauses offscreen scenes without adding a wrapper element.
 * @param props - Scene renderer and visibility fallback.
 * @returns The rendered scene with an observed element ref.
 * @example
 * <InView>{({ ref, inView }) => <div ref={ref} data-motion-visible={inView} />}</InView>
 */
export function InView({ children, fallbackInView = true }: InViewProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(fallbackInView);

  useEffect(() => {
    if (!element || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return children({ ref: setElement, inView });
}
