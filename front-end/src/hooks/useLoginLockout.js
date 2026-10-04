import {useEffect, useState} from 'react';

const cacheKey = 'learnify-login-lockouts-v1';
const normalize = value => String(value || '').trim().toLowerCase();

function readCache() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');
    return Object.fromEntries(Object.entries(stored).filter(([username, until]) =>
      /^[a-z0-9_.-]{3,30}$/.test(username) && Number.isFinite(until) && until > Date.now()));
  } catch { return {}; }
}

// This cache only restores the display after refresh. The server enforces every lockout.
export default function useLoginLockout(enabled = true) {
  const [locks, setLocks] = useState(readCache);
  const [username, setUsername] = useState(() => enabled ? Object.keys(locks).at(-1) || '' : '');
  const [now, setNow] = useState(Date.now);
  const key = normalize(username);
  const until = enabled && Object.hasOwn(locks, key) ? locks[key] : 0;
  const seconds = Math.max(0, Math.ceil((until - now) / 1000));

  useEffect(() => {
    try { sessionStorage.setItem(cacheKey, JSON.stringify(locks)); } catch {}
  }, [locks]);

  useEffect(() => {
    if (!until) return;
    const tick = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= until) setLocks(previous => Object.fromEntries(
        Object.entries(previous).filter(([, deadline]) => deadline > currentTime)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    return () => { clearInterval(timer); window.removeEventListener('focus', tick); };
  }, [until]);

  function record(error, attemptedUsername) {
    if (error.code !== 'LOGIN_LOCKED' || !(error.retryAfterSeconds > 0)) return false;
    const receivedAt = Date.now();
    setNow(receivedAt);
    setLocks(previous => ({...previous,
      [normalize(attemptedUsername)]: receivedAt + error.retryAfterSeconds * 1000}));
    return true;
  }

  function clear(attemptedUsername) {
    setLocks(previous => {
      const next = {...previous};
      delete next[normalize(attemptedUsername)];
      return next;
    });
  }

  return {username, setUsername, record, clear, seconds,
    countdown: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`};
}
