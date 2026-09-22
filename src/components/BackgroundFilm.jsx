import { useEffect, useRef, useState } from 'react';

/** Silent, viewport-aware film. The poster remains visible if motion is unavailable. */
export default function BackgroundFilm({ paused = false, className = '' }) {
  const host = useRef(null);
  const video = useRef(null);
  const syncPlayback = useRef(() => {});
  const pausedRef = useRef(paused);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
    syncPlayback.current();
  }, [paused]);

  useEffect(() => {
    const element = video.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    let visible = false;
    let disposed = false;
    let request = 0;

    const sync = () => {
      const version = ++request;
      const allowed = visible && !document.hidden && !pausedRef.current &&
        !preference.matches && !connection?.saveData;
      if (!allowed) {
        element.pause();
        return;
      }
      // Keep media requests out of the critical path and skip them on data-saving devices.
      if (!element.getAttribute('src')) {
        element.src = '/assets/wellness/centre-atmosphere.mp4';
      }
      element.muted = true;
      element.play().then(() => {
        if (disposed || (version !== request && (pausedRef.current || !visible || document.hidden || preference.matches || connection?.saveData))) element.pause();
      }).catch(() => { if (!disposed) setReady(false); });
    };
    syncPlayback.current = sync;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0.08 });
    observer.observe(host.current);
    preference.addEventListener('change', sync);
    connection?.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      disposed = true;
      syncPlayback.current = () => {};
      observer.disconnect();
      preference.removeEventListener('change', sync);
      connection?.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      element.pause();
      element.removeAttribute('src');
      element.load();
    };
  }, []);

  return (
    <div ref={host} className={`background-film ${className}`} data-ready={ready} aria-hidden="true">
      <img src="/assets/wellness/film-poster.webp" alt="" decoding="async" />
      <video ref={video} muted loop playsInline preload="none" tabIndex={-1}
        onPlaying={() => setReady(true)}
        onError={() => setReady(false)} />
    </div>
  );
}
