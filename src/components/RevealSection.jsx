import React, { useEffect, useRef, useState } from 'react';

export default function RevealSection({ children, id, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        io.unobserve(entry.target);
      }
    }, { threshold: 0.12 });

    if (ref.current) {
      io.observe(ref.current);
    }

    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id={id} className={`reveal ${visible ? 'in' : ''} ${className}`}>
      {children}
    </section>
  );
}
