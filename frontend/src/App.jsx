import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import Hero from './components/Hero.jsx';
import Loading from './components/Loading.jsx';
import Dashboard from './components/Dashboard.jsx';
import { generateItinerary } from './lib/api.js';

const REQUEST_TIMEOUT_MS = 90_000;

export default function App() {
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSubmit = useCallback(async (payload) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    setRequest(payload);
    setError('');
    setStatus('loading');

    try {
      const minDelay = window.__MIN_LOADING_MS ? new Promise((r) => setTimeout(r, window.__MIN_LOADING_MS)) : Promise.resolve();
      const [data] = await Promise.all([generateItinerary(payload, controller.signal), minDelay]);
      setResult(data);
      setStatus('done');
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err.name === 'AbortError') {
        if (!timedOut) return;
        setError('That took too long. Please try again.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
      setStatus('idle');
    } finally {
      clearTimeout(timer);
    }
  }, []);

  const handleCancel = () => {
    abortRef.current?.abort();
    setStatus('idle');
  };

  const handleReset = () => {
    setStatus('idle');
    setError('');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
            <circle cx="12" cy="16" r="10" fill="#2F3CF0" />
            <circle cx="20" cy="16" r="10" fill="#FF4F9A" className="mix-blend-multiply dark:mix-blend-screen" />
          </svg>
          <span className="text-xl font-extrabold tracking-tight">VibeSync</span>
        </div>
        <button
          id="theme-toggle-btn"
          type="button"
          onClick={() => setDarkMode((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border-2 border-ink bg-white/50 px-3.5 py-1.5 text-xs font-bold transition-all hover:bg-ink hover:text-white dark:bg-white/10"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="size-4 text-sun" /> : <Moon className="size-4 text-cobalt" />}
          <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </header>

      <main>
        {status === 'idle' && <Hero onSubmit={handleSubmit} error={error} initial={request} />}
        {status === 'loading' && <Loading request={request} onCancel={handleCancel} />}
        {status === 'done' && result && <Dashboard result={result} onReset={handleReset} />}
      </main>

      <footer className="mt-24 border-t border-ink/15 pt-6 text-sm text-ink-soft">
        Built for the Qloo Agentic Hackathon. Taste data by Qloo, reasoning by Groq.
      </footer>
    </div>
  );
}
