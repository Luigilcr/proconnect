'use client';

import { useEffect } from 'react';
import { supabase, isSupabaseEnabled } from './supabase';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

export function useInactivityTimeout(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    const interval = setInterval(async () => {
      if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(interval);
        events.forEach((ev) => window.removeEventListener(ev, updateActivity));
        if (isSupabaseEnabled && supabase) {
          try {
            await supabase.auth.signOut();
          } catch {}
        }
        window.location.href = '/login?reason=timeout';
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
    };
  }, [enabled]);
}
